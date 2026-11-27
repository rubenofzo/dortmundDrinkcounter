import { describe, expect, it } from "vitest";
import { GRAMS_PER_HOUR, loadAt, peakLoad, processedBy } from "./metabolism";

const H = 3_600_000;

describe("alcohol still in the system", () => {
  it("decays a single drink to zero at 7 g/h", () => {
    const intakes = [{ at: 0, grams: 14 }];
    expect(loadAt(intakes, 0)).toBe(14);
    expect(loadAt(intakes, H)).toBeCloseTo(14 - GRAMS_PER_HOUR);
    expect(loadAt(intakes, 2 * H)).toBe(0);
    expect(loadAt(intakes, 10 * H)).toBe(0);
  });
  it("is zero before any drink", () => {
    expect(loadAt([{ at: H, grams: 10 }], 0)).toBe(0);
    expect(loadAt([], 5 * H)).toBe(0);
  });
  it("stacks overlapping drinks", () => {
    const intakes = [
      { at: 0, grams: 14 },
      { at: H, grams: 14 },
    ];
    expect(loadAt(intakes, H)).toBeCloseTo(21);
    expect(peakLoad(intakes)).toEqual({ grams: 21, at: H });
  });
  it("never goes negative and doesn't bank time", () => {
    const intakes = [
      { at: 0, grams: 7 },
      { at: 5 * H, grams: 14 },
    ];
    expect(loadAt(intakes, 4 * H)).toBe(0);
    // The 4 empty hours don't pre-pay the second drink.
    expect(loadAt(intakes, 5 * H)).toBe(14);
    expect(loadAt(intakes, 6 * H)).toBeCloseTo(7);
  });
  it("tracks what was processed", () => {
    const intakes = [{ at: 0, grams: 14 }];
    expect(processedBy(intakes, H)).toBeCloseTo(7);
    expect(processedBy(intakes, 3 * H)).toBeCloseTo(14);
  });
  it("ignores input order", () => {
    expect(loadAt([{ at: H, grams: 14 }, { at: 0, grams: 14 }], H)).toBeCloseTo(21);
  });
});
