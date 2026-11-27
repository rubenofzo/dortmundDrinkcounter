import "server-only";
import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { databaseUrl, getDb, schema } from "@/db";
import { playerColor } from "./colors";
import { CATEGORY_ICON, gramsOf, pointsOf, type Category, type DrinkKind } from "./drinks";

export type Player = { id: number; name: string; slug: string; colorIndex: number; color: string };

export type DrinkType = {
  id: number;
  name: string;
  category: string;
  icon: string;
  ml: number;
  abv: number;
  sortOrder: number;
  hidden: boolean;
  /** Saved from the custom drink form. */
  custom: boolean;
  /** Special kind a custom drink counts as, if any. */
  kind: DrinkKind | null;
};

export type Drink = {
  id: number;
  playerId: number;
  drinkTypeId: number | null;
  name: string;
  category: Category;
  /** From the drink's menu item: a custom drink that counts as Weizen, Glühwein or Jäger. */
  kind: DrinkKind | null;
  icon: string;
  ml: number;
  abv: number;
  /** consumed_at in epoch ms. */
  at: number;
  loggedByPlayerId: number | null;
  /** created_at in epoch ms (the undo window runs from here). */
  createdAt: number;
  /** deleted_at in epoch ms, null while active. */
  deletedAt: number | null;
  grams: number;
  points: number;
};

/** Undo is open to anyone for this long after logging; after that only the admin can delete. */
export { UNDO_MS as UNDO_WINDOW_MS } from "./logging";

/**
 * Loads everything once per request; every stat, leaderboard and achievement is derived from
 * it on the fly (a weekend is a few hundred rows), so edits apply retroactively.
 */
export const getHub = cache(async () => {
  await connection();
  const db = getDb();
  const [playerRows, typeRows, drinkRows] = await Promise.all([
    db.select().from(schema.players).orderBy(asc(schema.players.name)),
    db.select().from(schema.drinkTypes).orderBy(asc(schema.drinkTypes.sortOrder), asc(schema.drinkTypes.id)),
    db.select().from(schema.drinks).orderBy(asc(schema.drinks.consumedAt), asc(schema.drinks.id)),
  ]);

  const players: Player[] = playerRows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    colorIndex: p.colorIndex,
    color: playerColor(p.colorIndex),
  }));
  const drinkTypes: DrinkType[] = typeRows.map((t) => ({ ...t, abv: Number(t.abv), kind: (t.kind as DrinkKind | null) ?? null }));
  const typeById = new Map(drinkTypes.map((t) => [t.id, t]));

  const all: Drink[] = drinkRows.map((d) => {
    const abv = Number(d.abv);
    const category = d.category as Category;
    return {
      id: d.id,
      playerId: d.playerId,
      drinkTypeId: d.drinkTypeId,
      name: d.name,
      category,
      kind: (d.drinkTypeId && typeById.get(d.drinkTypeId)?.kind) || null,
      icon: (d.drinkTypeId && typeById.get(d.drinkTypeId)?.icon) || CATEGORY_ICON[category] || "🍺",
      ml: d.ml,
      abv,
      at: d.consumedAt.getTime(),
      loggedByPlayerId: d.loggedByPlayerId,
      createdAt: d.createdAt.getTime(),
      deletedAt: d.deletedAt?.getTime() ?? null,
      grams: gramsOf(d.ml, abv),
      points: pointsOf(d.ml, abv),
    };
  });

  return {
    players,
    playerById: new Map(players.map((p) => [p.id, p])),
    /** Whole menu including hidden items (the picker filters `hidden`). */
    drinkTypes,
    /** Active drinks, oldest first. */
    drinks: all.filter((d) => d.deletedAt === null),
    /** Undone or deleted drinks (kept for the record, left out of every stat). */
    deletedDrinks: all.filter((d) => d.deletedAt !== null),
    /** Request time, so server-rendered clocks and countdowns match the client. */
    now: Date.now(),
  };
});

export type Hub = Awaited<ReturnType<typeof getHub>>;

/** Explains why the database can't be read, or null when everything works (shown by the layout). */
export async function getSetupProblem(): Promise<string | null> {
  if (!databaseUrl()) {
    return "DATABASE_URL is not set. On Vercel, connect a Neon database under Storage, then redeploy.";
  }
  // Outside the try, so Next's "render dynamically" signal isn't mistaken for a database error.
  await connection();
  try {
    await getHub();
    return null;
  } catch (err) {
    console.error("[drinkhub] loading data failed:", err);
    const code = findCode(err);
    if (code === "42P01") {
      return "The database is connected but its tables don't exist yet. Redeploy so the build can create them (or run npm run db:migrate).";
    }
    if (code === "28P01" || code === "28000") return "The database rejected the login in DATABASE_URL.";
    if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      return "The database server in DATABASE_URL can't be reached.";
    }
    return "Loading data from the database failed. The Vercel function logs have the details.";
  }
}

function findCode(err: unknown): string | undefined {
  for (let e = err as { code?: unknown; cause?: unknown } | undefined, i = 0; e && i < 5; e = e.cause as typeof e, i++) {
    if (typeof e.code === "string") return e.code;
  }
  return undefined;
}
