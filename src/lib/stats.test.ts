import { describe, expect, it } from "vitest";
import type { Drink } from "./data";
import { PILS_HALBE_POINTS } from "./drinks";
import { bestHour, dayEdges, longestDrySpell, longestStreak, playerStats, totals } from "./stats";

const berlin = (d: number, h: number, m = 0) => Date.UTC(2026, 10, d, h - 1, m);
let id = 0;
const drink = (at: number, points = 1, playerId = 1): Drink => ({
  id: ++id, playerId, drinkTypeId: 1, name: "Pils", category: "Beer", icon: "🍺", ml: 500, abv: 4.8, at,
  loggedByPlayerId: null, createdAt: at, deletedAt: null, grams: points * 10, points,
});

describe("totals", () => {
  it("sums drinks, points, litres and beer equivalent", () => {
    const t = totals([drink(berlin(27, 20)), drink(berlin(27, 21))]);
    expect(t.drinks).toBe(2);
    expect(t.liters).toBe(1);
    expect(t.pureMl).toBeCloseTo(48);
    expect(t.beerEquivalent).toBeCloseTo(2 / PILS_HALBE_POINTS);
  });
});

describe("hours", () => {
  it("finds the best hour and the longest streak", () => {
    const ds = [drink(berlin(27, 20, 5), 1), drink(berlin(27, 20, 40), 2), drink(berlin(27, 21, 10)), drink(berlin(27, 22, 10)), drink(berlin(27, 23, 59)), drink(berlin(28, 2, 0))];
    // Blocks 18–21 and 21–24 both have 3 points; the earlier block wins the tie.
    expect(bestHour(ds)).toEqual({ hour: berlin(27, 18), points: 3 });
    expect(longestStreak(ds)).toEqual({ hours: 4, from: berlin(27, 20) });
    expect(longestStreak([])).toBeNull();
  });
});

describe("day edges", () => {
  it("keeps the night after midnight on the same day", () => {
    const e = dayEdges([drink(berlin(27, 14)), drink(berlin(28, 3)), drink(berlin(28, 15))]);
    expect(e.map((x) => x.day)).toEqual(["2026-11-27", "2026-11-28"]);
    expect(e[0].last.at).toBe(berlin(28, 3));
  });
});

describe("dry spell", () => {
  it("counts only gaps between drinks, clipped to 12:00-02:00", () => {
    const ds = [drink(berlin(27, 13)), drink(berlin(27, 16)), drink(berlin(27, 23)), drink(berlin(28, 3, 30))];
    // gaps: 3h, 7h, then 23:00 -> 02:00 clipped to 3h
    expect(longestDrySpell(ds)?.ms).toBe(7 * 3_600_000);
    expect(longestDrySpell([drink(berlin(27, 13))])).toBeNull();
    expect(longestDrySpell([drink(berlin(27, 23)), drink(berlin(28, 5))])?.ms).toBe(3 * 3_600_000);
  });
});

describe("playerStats", () => {
  it("builds the metabolism block", () => {
    const s = playerStats([drink(berlin(27, 20))], berlin(27, 21));
    expect(s.load.current).toBeCloseTo(10 - 7);
    expect(s.load.curve.length).toBeGreaterThan(10);
    expect(s.pace?.perHour).toBeCloseTo(1);
  });
});
