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

export function berlinParts(ms: number): BerlinParts {
  const p = Object.fromEntries(partsFormat.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: p.weekday,
  };
}

/** Start of the Berlin hour containing `ms`. */
export function hourStart(ms: number): number {
  return Math.floor(ms / HOUR_MS) * HOUR_MS;
}

/** The 06:00-to-06:00 day `ms` belongs to, as "YYYY-MM-DD" (the date the day starts on). */
export function dayKey(ms: number): string {
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

/** "2:05" style countdown text from milliseconds. */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
