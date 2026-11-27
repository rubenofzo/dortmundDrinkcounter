import { describe, expect, it } from "vitest";
import { blockEnd, blockLabel, blocksBetween, blockStart, dayKey, formatCountdown, formatClock, hourLabel, hourStart, tripClock, tripDayNumber } from "./time";

// Friday 27 Nov 2026 is CET (UTC+1).
const berlin = (d: number, h: number, m = 0) => Date.UTC(2026, 10, d, h - 1, m);

describe("hour buckets in Europe/Berlin", () => {
  it("start on the Berlin hour", () => {
    const t = berlin(27, 23, 14);
    expect(hourStart(t)).toBe(berlin(27, 23));
    expect(hourLabel(hourStart(t))).toBe("Fri 23:00");
    expect(formatClock(t)).toBe("23:14");
  });
});

describe("days with the 06:00 cut-off", () => {
  it("counts the night after midnight as the same day", () => {
    expect(dayKey(berlin(27, 20))).toBe("2026-11-27");
    expect(dayKey(berlin(28, 2, 30))).toBe("2026-11-27");
    expect(dayKey(berlin(28, 5, 59))).toBe("2026-11-27");
    expect(dayKey(berlin(28, 6, 0))).toBe("2026-11-28");
  });
  it("numbers trip days", () => {
    expect(tripDayNumber("2026-11-27")).toBe(1);
    expect(tripDayNumber("2026-11-29")).toBe(3);
    expect(tripDayNumber("2026-11-30")).toBeNull();
    expect(tripClock(berlin(28, 1, 5))).toBe("Day 1 · 01:05");
  });
  it("handles a UTC time that is already the next Berlin day", () => {
    // 23:30 UTC on the 27th is 00:30 Berlin on the 28th, still day 1.
    expect(dayKey(Date.UTC(2026, 10, 27, 23, 30))).toBe("2026-11-27");
    // 05:30 UTC on the 28th is 06:30 Berlin: day 2.
    expect(dayKey(Date.UTC(2026, 10, 28, 5, 30))).toBe("2026-11-28");
  });
});

describe("3-hour blocks", () => {
  it("start at 12, 15, 18, 21 Berlin", () => {
    expect(blockStart(berlin(27, 13, 59))).toBe(berlin(27, 12));
    expect(blockStart(berlin(27, 15, 0))).toBe(berlin(27, 15));
    expect(blockStart(berlin(27, 23, 30))).toBe(berlin(27, 21));
    expect(blockStart(berlin(28, 1, 0))).toBe(berlin(28, 0));
  });
  it("label and step", () => {
    expect(blockLabel(berlin(27, 21))).toBe("Fri 21–24");
    expect(blockLabel(berlin(27, 12))).toBe("Fri 12–15");
    expect(blockEnd(berlin(27, 21))).toBe(berlin(28, 0));
    expect(blocksBetween(berlin(27, 12, 5), berlin(27, 20))).toEqual([berlin(27, 12), berlin(27, 15), berlin(27, 18)]);
  });
});

const HOUR = 3_600_000;

describe("formatCountdown", () => {
  it("shows hours for a 3-hour block", () => {
    expect(formatCountdown(125_000)).toBe("2:05");
    expect(formatCountdown(2 * HOUR + 12 * 60_000 + 4_000)).toBe("2:12:04");
  });
});
