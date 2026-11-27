import { describe, expect, it } from "vitest";
import { formatPoints, gramsOf, pointsOf } from "./drinks";

describe("points formula", () => {
  it("is grams of pure alcohol / 10", () => {
    expect(gramsOf(500, 4.8)).toBeCloseTo(18.936, 3);
    expect(pointsOf(500, 4.8)).toBeCloseTo(1.8936, 4);
  });
  it("matches the seed menu", () => {
    expect(formatPoints(pointsOf(330, 4.8))).toBe("1.2"); // 1.25 g/10, the spec table rounded up
    expect(formatPoints(pointsOf(500, 5.4))).toBe("2.1");
    expect(formatPoints(pointsOf(20, 40))).toBe("0.6");
    expect(formatPoints(pointsOf(200, 11))).toBe("1.7");
    expect(formatPoints(pointsOf(150, 12))).toBe("1.4");
  });
  it("formats with one decimal", () => {
    expect(formatPoints(0)).toBe("0.0");
    expect(formatPoints(12.345)).toBe("12.3");
  });
});
