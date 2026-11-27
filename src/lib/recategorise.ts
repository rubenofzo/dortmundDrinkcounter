import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

type Writer = Pick<ReturnType<typeof getDb>, "update">;

/**
 * Gives every drink already logged from a saved custom drink its new category, so a custom drink
 * that's changed to e.g. "Beer" counts for beer achievements back to its first sip. Name, ml and
 * ABV of logged drinks never change, so points stay the same.
 */
export async function recategorise(db: Writer, drinkTypeId: number, category: string): Promise<void> {
  await db.update(schema.drinks).set({ category }).where(eq(schema.drinks.drinkTypeId, drinkTypeId));
}
