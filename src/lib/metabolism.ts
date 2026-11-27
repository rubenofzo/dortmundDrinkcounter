/**
 * "Still in the system": a rough, fun estimate of how much alcohol someone still has to
 * process. Every drink adds its grams at the moment it's drunk; the body removes a steady
 * amount per hour until it reaches zero (never below, and no "banking" time before a drink).
 * Not a sobriety or driving check: we never show promille or a "sober at" time.
 */
export const GRAMS_PER_HOUR = 7;
const HOUR_MS = 3_600_000;

export type Intake = { at: number; grams: number };

/** Grams still to process at `at`, given intakes in any order (only those at or before `at` count). */
export function loadAt(intakes: Intake[], at: number, rate = GRAMS_PER_HOUR): number {
  let load = 0;
  let t = -Infinity;
  for (const d of sorted(intakes)) {
    if (d.at > at) break;
    load = decay(load, d.at - t, rate) + d.grams;
    t = d.at;
  }
  return t === -Infinity ? 0 : decay(load, at - t, rate);
}

/** Highest load reached up to `until` (peaks always happen right after a drink). */
export function peakLoad(intakes: Intake[], until = Infinity, rate = GRAMS_PER_HOUR): { grams: number; at: number } | null {
  let load = 0;
  let t = -Infinity;
  let peak: { grams: number; at: number } | null = null;
  for (const d of sorted(intakes)) {
    if (d.at > until) break;
    load = decay(load, d.at - t, rate) + d.grams;
    t = d.at;
    if (!peak || load > peak.grams) peak = { grams: load, at: d.at };
  }
  return peak;
}

/** Grams already processed by `at`: everything drunk so far minus what's still in the system. */
export function processedBy(intakes: Intake[], at: number, rate = GRAMS_PER_HOUR): number {
  const drunk = intakes.filter((d) => d.at <= at).reduce((s, d) => s + d.grams, 0);
  return drunk - loadAt(intakes, at, rate);
}

/** Load sampled every `stepMs` from `from` to `to` (inclusive), for the sparkline. */
export function loadCurve(
  intakes: Intake[],
  from: number,
  to: number,
  stepMs = 15 * 60_000,
  rate = GRAMS_PER_HOUR,
): { at: number; grams: number }[] {
  const out: { at: number; grams: number }[] = [];
  for (let t = from; t <= to; t += stepMs) out.push({ at: t, grams: loadAt(intakes, t, rate) });
  if (out.at(-1)?.at !== to) out.push({ at: to, grams: loadAt(intakes, to, rate) });
  return out;
}

function decay(load: number, elapsedMs: number, rate: number): number {
  if (!Number.isFinite(elapsedMs)) return 0;
  return Math.max(0, load - (rate * elapsedMs) / HOUR_MS);
}

function sorted(intakes: Intake[]): Intake[] {
  return [...intakes].sort((a, b) => a.at - b.at);
}
