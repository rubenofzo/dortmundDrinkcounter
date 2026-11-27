"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { cleanName } from "@/lib/names";
import { MAX_ROOM_SIZE } from "@/lib/rooms";

// Anyone can manage rooms from the People page, like anyone can log a drink for anyone.

type Result = { ok: true } | { ok: false; error: string };
const id = z.number().int().positive();

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

const roomSchema = z.object({
  name: z.string().trim().min(1, "Give the room a name.").max(24, "Room names are at most 24 characters."),
  icon: z.string().trim().min(1).max(16),
});

/** Makes a new, empty room. */
export async function createRoom(input: { name: string; icon: string }): Promise<Result> {
  const p = roomSchema.safeParse({ name: cleanName(String(input?.name ?? "")), icon: input?.icon });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the room name." };
  try {
    await getDb().insert(schema.rooms).values(p.data);
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: "There's already a room with that name." };
    throw err;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Puts a person in a room (moving them out of their old one), or out of any room with `roomId: null`. */
export async function setRoom(input: { playerId: number; roomId: number | null }): Promise<Result> {
  const p = z.object({ playerId: id, roomId: id.nullable() }).safeParse(input);
  if (!p.success) return { ok: false, error: "Couldn't read that, try again." };
  const { playerId, roomId } = p.data;
  const result = await getDb().transaction(async (tx): Promise<Result> => {
    if (roomId !== null) {
      // Lock the room so two phones can't both add a fifth person.
      const [room] = await tx.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).for("update");
      if (!room) return { ok: false, error: "That room no longer exists." };
      const [{ n }] = await tx
        .select({ n: count() })
        .from(schema.players)
        .where(and(eq(schema.players.roomId, roomId), ne(schema.players.id, playerId)));
      if (n >= MAX_ROOM_SIZE) return { ok: false, error: `${room.name} is full (${MAX_ROOM_SIZE} people).` };
    }
    const updated = await tx
      .update(schema.players)
      .set({ roomId })
      .where(eq(schema.players.id, playerId))
      .returning({ id: schema.players.id });
    return updated.length ? { ok: true } : { ok: false, error: "That person no longer exists." };
  });
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

/** Deletes a room, only once it's empty (so nobody loses their room by a stray tap). */
export async function deleteRoom(input: { roomId: number }): Promise<Result> {
  const p = z.object({ roomId: id }).safeParse(input);
  if (!p.success) return { ok: false, error: "Couldn't read that, try again." };
  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.players).where(eq(schema.players.roomId, p.data.roomId));
  if (n > 0) return { ok: false, error: "Take everyone out of the room first." };
  await db.delete(schema.rooms).where(eq(schema.rooms.id, p.data.roomId));
  revalidatePath("/", "layout");
  return { ok: true };
}
