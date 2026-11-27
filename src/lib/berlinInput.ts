import { berlinParts } from "@/lib/time";

const pad = (n: number) => String(n).padStart(2, "0");

/** Epoch ms to a Berlin `datetime-local` value, e.g. "2026-11-27T23:14". */
export function toBerlinInput(ms: number): string {
  const p = berlinParts(ms);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Berlin's UTC offset (ms) at an instant. */
function offsetAt(ms: number): number {
  const p = berlinParts(ms);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(ms / 60_000) * 60_000;
}

/** A Berlin `datetime-local` value to epoch ms, or null if it isn't valid. */
export function fromBerlinInput(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  if (Number.isNaN(wall)) return null;
  // Guess with the offset at the wall time read as UTC, then refine once (handles DST edges).
  let ms = wall - offsetAt(wall);
  ms = wall - offsetAt(ms);
  // Reject dates that rolled over (e.g. 31 Nov) and the skipped hour in spring.
  return toBerlinInput(ms) === value.trim() ? ms : null;
}
