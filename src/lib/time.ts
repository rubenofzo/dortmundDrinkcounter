/**
 * Everything is Europe/Berlin. Berlin's UTC offset is always whole hours, so an hour bucket
 * starts at a whole UTC hour too, and hour keys are plain epoch milliseconds.
 */
export const TZ = "Europe/Berlin";
export const HOUR_MS = 3_600_000;
/** Days run from 06:00 to 06:00, so a night out counts as one day. */
export const DAY_START_HOUR = 6;

/** Trip: Friday 27 to Sunday 29 November 2026 (days by the 06:00 cut-off). */
export const TRIP_DAYS = ["2026-11-27", "2026-11-28", "2026-11-29"] as const;
/** First hour chip on the leaderboard (Fri 12:00 Berlin) and the end of the trip (Mon 06:00 Berlin). */
export const TRIP_START_MS = Date.UTC(2026, 10, 27, 11);
export const TRIP_END_MS = Date.UTC(2026, 10, 30, 5);

export type BerlinParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: string };

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

/**
 * Berlin wall-clock parts are the same for a whole minute, and `Intl` formatting is slow, so
 * results are cached per minute. The achievement replay asks for the same few hundred moments
 * thousands of times; without the cache a person's page took seconds to render.
 */
const partsCache = new Map<number, Readonly<BerlinParts>>();
const PARTS_CACHE_MAX = 50_000;

export function berlinParts(ms: number): Readonly<BerlinParts> {
  const minute = Math.floor(ms / 60_000);
  const hit = partsCache.get(minute);
  if (hit) return hit;
  const p = Object.fromEntries(partsFormat.formatToParts(new Date(minute * 60_000)).map((x) => [x.type, x.value]));
  const parts = Object.freeze({
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: p.weekday,
  });
  if (partsCache.size >= PARTS_CACHE_MAX) partsCache.clear();
  partsCache.set(minute, parts);
  return parts;
}

/** Start of the Berlin hour containing `ms`. */
export function hourStart(ms: number): number {
  return Math.floor(ms / HOUR_MS) * HOUR_MS;
}

/** The 06:00-to-06:00 day `ms` belongs to, as "YYYY-MM-DD" (the date the day starts on). */
const dayKeyCache = new Map<number, string>();

export function dayKey(ms: number): string {
  const minute = Math.floor(ms / 60_000);
  const hit = dayKeyCache.get(minute);
  if (hit !== undefined) return hit;
  const key = computeDayKey(ms);
  if (dayKeyCache.size >= PARTS_CACHE_MAX) dayKeyCache.clear();
  dayKeyCache.set(minute, key);
  return key;
}

function computeDayKey(ms: number): string {
  const p = berlinParts(ms);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  if (p.hour < DAY_START_HOUR) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** The Berlin calendar date of `ms` (midnight cut-off), "YYYY-MM-DD". */
export function calendarDate(ms: number): string {
  const p = berlinParts(ms);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Trip day number (1 = Friday) for a day key, or null outside the trip. */
export function tripDayNumber(key: string): number | null {
  const i = (TRIP_DAYS as readonly string[]).indexOf(key);
  return i === -1 ? null : i + 1;
}

/** "23:14". */
export function formatClock(ms: number): string {
  const p = berlinParts(ms);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** "Fri 20:00" for an hour bucket. */
export function hourLabel(ms: number): string {
  const p = berlinParts(ms);
  return `${p.weekday} ${String(p.hour).padStart(2, "0")}:00`;
}

/** "Fri 23:14". */
export function formatDayTime(ms: number): string {
  return `${berlinParts(ms).weekday} ${formatClock(ms)}`;
}

/** "Fri 27 Nov" for a day key. */
export function dayLabel(key: string): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** "Day 1 · 23:14" during the trip, else "Fri 23:14". */
export function tripClock(ms: number): string {
  const n = tripDayNumber(dayKey(ms));
  return n ? `Day ${n} · ${formatClock(ms)}` : formatDayTime(ms);
}

/** Hour buckets from `from` to `to` inclusive (both rounded down to the hour). */
export function hoursBetween(from: number, to: number): number[] {
  const out: number[] = [];
  for (let h = hourStart(from); h <= hourStart(to); h += HOUR_MS) out.push(h);
  return out;
}

/** Countdown text from milliseconds: "2:05", or "2:12:04" from an hour up. */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * Leaderboard blocks: 3 hours each, starting at 00, 03, 06, 09, 12, 15, 18 and 21 Berlin time
 * (so 12–15, 15–18, 18–21, 21–24, ...).
 */
export const BLOCK_HOURS = 3;
export const BLOCK_MS = BLOCK_HOURS * HOUR_MS;

/** Start of the Berlin 3-hour block containing `ms`. */
export function blockStart(ms: number): number {
  return hourStart(ms) - (berlinParts(ms).hour % BLOCK_HOURS) * HOUR_MS;
}

/** End of the block starting at `start` (the next block's start, safe across clock changes). */
export function blockEnd(start: number): number {
  return blockStart(start + BLOCK_MS + HOUR_MS);
}

/** Block starts from the block containing `from` to the one containing `to`, inclusive. */
export function blocksBetween(from: number, to: number): number[] {
  const out: number[] = [];
  for (let b = blockStart(from); b <= blockStart(to); b = blockEnd(b)) out.push(b);
  return out;
}

/** "Fri 12–15" (21–24 for the last block of the evening). */
export function blockLabel(start: number): string {
  const p = berlinParts(start);
  const end = p.hour + BLOCK_HOURS;
  return `${p.weekday} ${String(p.hour).padStart(2, "0")}–${String(end).padStart(2, "0")}`;
}
