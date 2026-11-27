import { describe, expect, it } from "vitest";
import { fromBerlinInput, toBerlinInput } from "./berlinInput";

describe("berlinInput", () => {
  it("converts winter time (CET, UTC+1)", () => {
    const ms = Date.UTC(2026, 10, 27, 22, 14);
    expect(toBerlinInput(ms)).toBe("2026-11-27T23:14");
    expect(fromBerlinInput("2026-11-27T23:14")).toBe(ms);
  });
  it("converts summer time (CEST, UTC+2)", () => {
    const ms = Date.UTC(2026, 6, 1, 10, 5);
    expect(toBerlinInput(ms)).toBe("2026-07-01T12:05");
    expect(fromBerlinInput("2026-07-01T12:05")).toBe(ms);
  });
  it("handles the day after midnight", () => {
    expect(fromBerlinInput("2026-11-28T00:30")).toBe(Date.UTC(2026, 10, 27, 23, 30));
  });
  it("round-trips across the autumn change", () => {
    for (const h of [0, 1, 2, 3, 4]) {
      const ms = Date.UTC(2026, 9, 25, h, 15);
      const s = toBerlinInput(ms);
      expect(toBerlinInput(fromBerlinInput(s)!)).toBe(s);
    }
  });
  it("rejects garbage and non-existent times", () => {
    expect(fromBerlinInput("nope")).toBeNull();
    expect(fromBerlinInput("2026-11-31T10:00")).toBeNull();
    expect(fromBerlinInput("2026-03-29T02:30")).toBeNull();
  });
});
