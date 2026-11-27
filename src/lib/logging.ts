import { z } from "zod";

/** Undo window (re-exported as `UNDO_WINDOW_MS` from data.ts; this file is shared with the client). */
export const UNDO_MS = 2 * 60_000;

/** One log per person per this long (stops double taps and spamming). */
export const RATE_LIMIT_MS = 10_000;

/** Volume chips offered for custom drinks. */
export const CUSTOM_ML_CHIPS = [20, 40, 200, 330, 500] as const;

/** Size chips for logging a menu drink in another size (a pitcher, a big glass, ...). */
export const SIZE_ML_CHIPS = [200, 250, 330, 400, 500, 1000] as const;

/** Largest volume one log may have (a 2 L pitcher plus some). */
export const MAX_ML = 3000;

/** True while a drink logged at `createdAt` can still be undone by anyone. */
export function canUndo(createdAt: number, now: number, windowMs = UNDO_MS): boolean {
  return now - createdAt < windowMs;
}

/** Milliseconds left until the person may log again (0 when allowed). */
export function rateLimitRemaining(lastCreatedAt: number | null, now: number, limitMs = RATE_LIMIT_MS): number {
  if (lastCreatedAt === null) return 0;
  return Math.max(0, lastCreatedAt + limitMs - now);
}

const honeypot = z.string().max(0).optional();

export const customDrinkSchema = z.object({
  name: z.string().trim().min(1).max(40),
  ml: z.number().int().min(1).max(MAX_ML),
  abv: z.number().min(0).max(100),
});

export const logDrinkSchema = z
  .object({
    playerId: z.number().int().positive(),
    drinkTypeId: z.number().int().positive().optional(),
    custom: customDrinkSchema.optional(),
    /** Own size in ml for a menu drink (ignored for custom drinks, which carry their own). */
    ml: z.number().int().min(1).max(MAX_ML).optional(),
    /** Honeypot: real users never fill this in. */
    website: honeypot,
  })
  .refine((v) => (v.drinkTypeId !== undefined) !== (v.custom !== undefined), {
    message: "Pick a drink or enter a custom one",
  });

export const addMeSchema = z.object({ name: z.string().trim().min(1).max(30) });

export type LogDrinkInput = z.input<typeof logDrinkSchema>;
export type LogResult =
  | { ok: true; drinkId: number; label: string; playerName: string; createdAt: number }
  | { ok: false; error: string };
