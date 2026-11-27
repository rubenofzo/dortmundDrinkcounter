"use server";

import { and, desc, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { getHub, UNDO_WINDOW_MS } from "@/lib/data";
import { CATEGORY_ICON, formatVolume, type Category } from "@/lib/drinks";
import { getMe, setMe } from "@/lib/identity";
import { addMeSchema, logDrinkSchema, rateLimitRemaining, type LogDrinkInput, type LogResult } from "@/lib/logging";
import { cleanName, normalizeName, slugify } from "@/lib/names";
import { recategorise } from "@/lib/recategorise";

type Simple = { ok: true } | { ok: false; error: string };

/** "Who are you?": remember this phone as an existing player. */
export async function pickMe(playerId: number): Promise<Simple> {
  const [row] = await getDb().select({ id: schema.players.id }).from(schema.players).where(eq(schema.players.id, Number(playerId)));
  if (!row) return { ok: false, error: "Unknown player" };
  await setMe(row.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** "Add me": create a player (unique name and slug, next colour), then remember it. */
export async function addMe(name: string): Promise<Simple> {
  const parsed = addMeSchema.safeParse({ name: cleanName(String(name ?? "")) });
  if (!parsed.success) return { ok: false, error: "Enter a name (up to 30 characters)" };
  const clean = cleanName(parsed.data.name);
  const db = getDb();

  const existing = await db.select().from(schema.players);
  const dupe = existing.find((p) => normalizeName(p.name) === normalizeName(clean));
  if (dupe) {
    // Same person on a new phone: just pick them instead of creating a twin.
    await setMe(dupe.id);
    revalidatePath("/", "layout");
    return { ok: true };
  }
  const taken = new Set(existing.map((p) => p.slug));
  const base = slugify(clean);
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

  const [{ top }] = await db.select({ top: max(schema.players.colorIndex) }).from(schema.players);
  try {
    const [row] = await db
      .insert(schema.players)
      .values({ name: clean, slug, colorIndex: (top ?? -1) + 1 })
      .returning({ id: schema.players.id });
    await setMe(row.id);
  } catch {
    return { ok: false, error: "That name is taken, try another" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Logs one drink for `playerId` (menu item or custom), copying ml/abv/name at this moment. */
export async function logDrink(input: LogDrinkInput): Promise<LogResult> {
  const parsed = logDrinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Couldn't read that drink, try again" };
  const { playerId, drinkTypeId, custom, ml } = parsed.data;

  const hub = await getHub();
  const me = await getMe(hub);
  const db = getDb();

  const result = await db.transaction(async (tx): Promise<LogResult> => {
    // Lock the person's row so two quick taps can't both pass the rate-limit check.
    const [player] = await tx.select().from(schema.players).where(eq(schema.players.id, playerId)).for("update");
    if (!player) return { ok: false, error: "Unknown player" };

    const [last] = await tx
      .select({ createdAt: schema.drinks.createdAt })
      .from(schema.drinks)
      .where(and(eq(schema.drinks.playerId, playerId), isNull(schema.drinks.deletedAt)))
      .orderBy(desc(schema.drinks.createdAt))
      .limit(1);
    const wait = rateLimitRemaining(last?.createdAt.getTime() ?? null, Date.now());
    if (wait > 0) {
      return { ok: false, error: `Easy! ${player.name} just logged one. Try again in ${Math.ceil(wait / 1000)} s` };
    }

    let item: { name: string; category: Category; icon: string; ml: number; abv: number; typeId: number | null };
    if (drinkTypeId !== undefined) {
      const [t] = await tx.select().from(schema.drinkTypes).where(eq(schema.drinkTypes.id, drinkTypeId));
      if (!t || t.hidden) return { ok: false, error: "That drink isn't on the menu" };
      // A chosen size replaces the menu size; ABV and name stay the menu's.
      item = { name: t.name, category: t.category as Category, icon: t.icon, ml: ml ?? t.ml, abv: Number(t.abv), typeId: t.id };
    } else {
      // A custom drink is saved as a custom menu item with its category (or updates the saved
      // one with that name), so it can be logged again in one tap. A name taken by a regular
      // menu item is logged as-is without saving.
      const c = custom!;
      const icon = c.icon || CATEGORY_ICON.Custom;
      const [existing] = await tx.select().from(schema.drinkTypes).where(eq(schema.drinkTypes.name, c.name));
      let typeId: number | null = null;
      if (existing?.custom) {
        await tx
          .update(schema.drinkTypes)
          .set({ icon, ml: c.ml, abv: c.abv, category: c.category, kind: c.kind, hidden: false })
          .where(eq(schema.drinkTypes.id, existing.id));
        await recategorise(tx, existing.id, c.category);
        typeId = existing.id;
      } else if (!existing) {
        const [created] = await tx
          .insert(schema.drinkTypes)
          .values({ name: c.name, category: c.category, icon, ml: c.ml, abv: c.abv, sortOrder: 1000, custom: true, kind: c.kind })
          .returning({ id: schema.drinkTypes.id });
        typeId = created.id;
      }
      item = { name: c.name, category: c.category, icon, ml: c.ml, abv: c.abv, typeId };
    }

    const [row] = await tx
      .insert(schema.drinks)
      .values({
        playerId,
        drinkTypeId: item.typeId,
        name: item.name,
        category: item.category,
        ml: item.ml,
        abv: item.abv,
        loggedByPlayerId: me?.id ?? null,
      })
      .returning({ id: schema.drinks.id, createdAt: schema.drinks.createdAt });
    return {
      ok: true,
      drinkId: row.id,
      label: `${item.icon} ${item.name} ${formatVolume(item.ml)}`,
      playerName: player.name,
      createdAt: row.createdAt.getTime(),
    };
  });

  if (result.ok) revalidatePath("/", "layout");
  return result;
}

/** Soft-deletes a drink; anyone may do it for UNDO_WINDOW_MS after it was logged. */
export async function undoDrink(drinkId: number): Promise<Simple> {
  const db = getDb();
  const [d] = await db.select().from(schema.drinks).where(eq(schema.drinks.id, Number(drinkId)));
  if (!d || d.deletedAt) return { ok: false, error: "Already gone" };
  if (Date.now() - d.createdAt.getTime() >= UNDO_WINDOW_MS) return { ok: false, error: "Too late to undo (ask the admin)" };
  await db.update(schema.drinks).set({ deletedAt: new Date() }).where(and(eq(schema.drinks.id, d.id), isNull(schema.drinks.deletedAt)));
  revalidatePath("/", "layout");
  return { ok: true };
}
