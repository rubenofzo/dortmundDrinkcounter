"use server";

import { and, eq, isNull, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { endAdminSession, passwordMatches, requireAdmin, startAdminSession } from "@/lib/auth";
import { CATEGORIES } from "@/lib/drinks";
import { cleanName, slugify } from "@/lib/names";

export type LoginState = { error?: string };
export type Result = { ok: true } | { ok: false; error: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD is not configured on the server." };
  if (!passwordMatches(password)) return { error: "Wrong password." };
  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/");
}

const done = (): Result => {
  revalidatePath("/", "layout");
  return { ok: true };
};
const fail = (error: string): Result => ({ ok: false, error });
const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid input.";

const id = z.number().int().positive();
const nameField = z.string().transform(cleanName).pipe(z.string().min(1, "Name is required.").max(60, "Name is too long."));

// ---- Players ----

/** Renames a player, keeping the slug in sync. Names and slugs stay unique. */
export async function renamePlayer(input: { playerId: number; name: string }): Promise<Result> {
  await requireAdmin();
  const p = z.object({ playerId: id, name: nameField }).safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  const { playerId, name } = p.data;
  const slug = slugify(name);
  const db = getDb();
  const clash = await db
    .select({ id: schema.players.id })
    .from(schema.players)
    .where(and(ne(schema.players.id, playerId), or(eq(schema.players.name, name), eq(schema.players.slug, slug))))
    .limit(1);
  if (clash.length > 0) return fail("Another player already has that name.");
  const updated = await db
    .update(schema.players)
    .set({ name, slug })
    .where(eq(schema.players.id, playerId))
    .returning({ id: schema.players.id });
  if (updated.length === 0) return fail("That player no longer exists.");
  return done();
}

/** Moves every drink of `fromId` (and its logged-by references) to `intoId`, then deletes `fromId`. */
export async function mergePlayers(input: { fromId: number; intoId: number }): Promise<Result> {
  await requireAdmin();
  const p = z.object({ fromId: id, intoId: id }).safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  const { fromId, intoId } = p.data;
  if (fromId === intoId) return fail("Pick two different players.");
  const ok = await getDb().transaction(async (tx) => {
    const found = await tx
      .select({ id: schema.players.id })
      .from(schema.players)
      .where(or(eq(schema.players.id, fromId), eq(schema.players.id, intoId)));
    if (found.length !== 2) return false;
    await tx.update(schema.drinks).set({ playerId: intoId }).where(eq(schema.drinks.playerId, fromId));
    await tx.update(schema.drinks).set({ loggedByPlayerId: intoId }).where(eq(schema.drinks.loggedByPlayerId, fromId));
    await tx.delete(schema.players).where(eq(schema.players.id, fromId));
    return true;
  });
  return ok ? done() : fail("One of those players no longer exists.");
}

/** Removes a player; their drinks go with them (cascade). */
export async function removePlayer(input: { playerId: number }): Promise<Result> {
  await requireAdmin();
  const p = z.object({ playerId: id }).safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  await getDb().delete(schema.players).where(eq(schema.players.id, p.data.playerId));
  return done();
}

// ---- Drink menu ----

const menuSchema = z.object({
  name: nameField,
  category: z.enum(CATEGORIES, "Pick a category."),
  icon: z.string().trim().min(1, "Pick an icon.").max(8, "Icon: one emoji."),
  ml: z.number().int("ml must be a whole number.").min(1).max(5000),
  abv: z.number().min(0, "ABV can't be negative.").max(100, "ABV is at most 100."),
  sortOrder: z.number().int().min(-9999).max(9999),
});
export type MenuInput = z.input<typeof menuSchema>;

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function addDrinkType(input: MenuInput): Promise<Result> {
  await requireAdmin();
  const p = menuSchema.safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  try {
    await getDb().insert(schema.drinkTypes).values(p.data);
  } catch (err) {
    if (isUniqueViolation(err)) return fail("A menu item with that name exists.");
    throw err;
  }
  return done();
}

/** Edits the menu only; logged drinks keep their own copy of name, ml and ABV. */
export async function updateDrinkType(input: MenuInput & { drinkTypeId: number }): Promise<Result> {
  await requireAdmin();
  const p = menuSchema.extend({ drinkTypeId: id }).safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  const { drinkTypeId, ...values } = p.data;
  try {
    const updated = await getDb()
      .update(schema.drinkTypes)
      .set(values)
      .where(eq(schema.drinkTypes.id, drinkTypeId))
      .returning({ id: schema.drinkTypes.id });
    if (updated.length === 0) return fail("That menu item no longer exists.");
  } catch (err) {
    if (isUniqueViolation(err)) return fail("A menu item with that name exists.");
    throw err;
  }
  return done();
}

export async function setDrinkTypeHidden(input: { drinkTypeId: number; hidden: boolean }): Promise<Result> {
  await requireAdmin();
  const p = z.object({ drinkTypeId: id, hidden: z.boolean() }).safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  await getDb().update(schema.drinkTypes).set({ hidden: p.data.hidden }).where(eq(schema.drinkTypes.id, p.data.drinkTypeId));
  return done();
}

// ---- Logged drinks ----

const drinkSchema = z.object({
  drinkId: id,
  playerId: id,
  name: nameField,
  ml: z.number().int("ml must be a whole number.").min(1).max(5000),
  abv: z.number().min(0).max(100),
  at: z.number().int().positive("Pick a valid time."),
});
export type UpdateDrinkInput = z.input<typeof drinkSchema>;

/** Changes who drank it, what it was, and when. Does not touch the menu. */
export async function updateDrink(input: UpdateDrinkInput): Promise<Result> {
  await requireAdmin();
  const p = drinkSchema.safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  const { drinkId, playerId, name, ml, abv, at } = p.data;
  const db = getDb();
  const [player] = await db.select({ id: schema.players.id }).from(schema.players).where(eq(schema.players.id, playerId));
  if (!player) return fail("That person no longer exists.");
  const updated = await db
    .update(schema.drinks)
    .set({ playerId, name, ml, abv, consumedAt: new Date(at) })
    .where(and(eq(schema.drinks.id, drinkId), isNull(schema.drinks.deletedAt)))
    .returning({ id: schema.drinks.id });
  if (updated.length === 0) return fail("That drink no longer exists.");
  return done();
}

/** Soft delete: the row stays but leaves every stat. */
export async function deleteDrink(input: { drinkId: number }): Promise<Result> {
  await requireAdmin();
  const p = z.object({ drinkId: id }).safeParse(input);
  if (!p.success) return fail(firstError(p.error));
  await getDb()
    .update(schema.drinks)
    .set({ deletedAt: new Date() })
    .where(and(eq(schema.drinks.id, p.data.drinkId), isNull(schema.drinks.deletedAt)));
  return done();
}
