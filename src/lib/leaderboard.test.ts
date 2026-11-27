import { describe, expect, it } from "vitest";
import type { Drink, Player } from "./data";
import { hourWinners, rankDrinks } from "./leaderboard";
import { dayKey, HOUR_MS } from "./time";

const players: Player[] = ["Ana", "Ben", "Cy"].map((name, i) => ({
  id: i + 1,
  name,
  slug: name.toLowerCase(),
  colorIndex: i,
  color: "#fff",
}));
const H = Date.UTC(2026, 10, 27, 18); // Fri 19:00 Berlin
let n = 0;
const drink = (playerId: number, at: number, points: number, icon = "🍺"): Drink =>
  ({ id: ++n, playerId, at, points, icon }) as Drink;

describe("rankDrinks", () => {
  it("skips players without drinks and shares ranks on ties", () => {
    const r = rankDrinks([drink(2, H, 2), drink(1, H, 2), drink(3, H, 1)], players);
    expect(r.map((x) => [x.player.name, x.rank])).toEqual([["Ana", 1], ["Ben", 1], ["Cy", 3]]);
    expect(rankDrinks([drink(2, H, 1)], players)).toHaveLength(1);
  });
  it("counts drinks and picks the most frequent icon", () => {
    const r = rankDrinks([drink(1, H, 1, "🍷"), drink(1, H, 1, "🍺"), drink(1, H, 1, "🍺")], players);
    expect(r[0]).toMatchObject({ drinks: 3, topIcon: "🍺", points: 3 });
  });
  it("ranks a day bucket by dayKey (06:00 cut-off)", () => {
    const late = Date.UTC(2026, 10, 28, 1); // Sat 02:00 Berlin, still Friday's day
    const morning = Date.UTC(2026, 10, 28, 6); // Sat 07:00 Berlin
    const ds = [drink(1, late, 3), drink(2, morning, 5)];
    const fri = ds.filter((d) => dayKey(d.at) === "2026-11-27");
    expect(rankDrinks(fri, players)[0].player.name).toBe("Ana");
    expect(rankDrinks(ds.filter((d) => dayKey(d.at) === "2026-11-28"), players)[0].player.name).toBe("Ben");
  });
});

describe("hourWinners", () => {
  it("only counts completed hours and keeps ties", () => {
    const ds = [drink(1, H + 5, 2), drink(2, H + 9, 2), drink(3, H + HOUR_MS + 5, 4), drink(3, H + 2 * HOUR_MS + 5, 9)];
    const w = hourWinners(ds, H + 2 * HOUR_MS + 10);
    expect([...w.entries()]).toEqual([
      [H, [1, 2]],
      [H + HOUR_MS, [3]],
    ]);
  });
});
