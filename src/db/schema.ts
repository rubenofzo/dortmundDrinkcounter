import { boolean, index, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  /** Index into the player palette (`src/lib/colors.ts`), fixed at creation so colours never shift. */
  colorIndex: integer("color_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** The drink menu. Editing it never changes history: logged drinks copy ml and ABV. */
export const drinkTypes = pgTable("drink_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  /** "Beer" | "Wine" | "Mixed" | "Shots" (see `CATEGORIES` in `src/lib/drinks.ts`). */
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  ml: integer("ml").notNull(),
  abv: numeric("abv", { precision: 4, scale: 1, mode: "number" }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false),
});

export const drinks = pgTable(
  "drinks",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    /** Null for a custom drink. */
    drinkTypeId: integer("drink_type_id").references(() => drinkTypes.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** "Beer" | "Wine" | "Mixed" | "Shots" | "Custom". */
    category: text("category").notNull(),
    ml: integer("ml").notNull(),
    abv: numeric("abv", { precision: 4, scale: 1, mode: "number" }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }).notNull().defaultNow(),
    /** Who tapped the button; only for the feed and undo, never for stats. */
    loggedByPlayerId: integer("logged_by_player_id").references(() => players.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Soft delete: undone/deleted drinks stay for the Sticky Fingers achievement. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("drinks_consumed_at_idx").on(t.consumedAt), index("drinks_player_consumed_at_idx").on(t.playerId, t.consumedAt)],
);
