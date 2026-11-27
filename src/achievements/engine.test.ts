import { describe, expect, it } from "vitest";
import type { Drink, Player } from "@/lib/data";
import { gramsOf, pointsOf } from "@/lib/drinks";
import { HOUR_MS } from "@/lib/time";
import { evaluateAchievements, type EngineInput } from "./engine";

/** Berlin is UTC+1 in late November. Friday 27 Nov 2026 at hh:mm Berlin. */
const fri = (h: number, m = 0, day = 27) => Date.UTC(2026, 10, day, h - 1, m);

const players: Player[] = ["Anna", "Ben", "Cem", "Dora", "Eli"].map((name, i) => ({
  id: i + 1,
  name,
  slug: name.toLowerCase(),
  colorIndex: i,
  color: "#fff",
}));

let nextId = 1;
function drink(
  playerId: number,
  at: number,
  o: Partial<Pick<Drink, "name" | "category" | "ml" | "abv" | "drinkTypeId" | "kind">> = {},
): Drink {
  const ml = o.ml ?? 500;
  const abv = o.abv ?? 4.8;
  return {
    id: nextId++,
    playerId,
    drinkTypeId: o.drinkTypeId === undefined ? 1 : o.drinkTypeId,
    name: o.name ?? "Pils (Halbe)",
    category: o.category ?? "Beer",
    kind: o.kind ?? null,
    icon: "🍺",
    ml,
    abv,
    at,
    loggedByPlayerId: null,
    createdAt: at,
    deletedAt: null,
    grams: gramsOf(ml, abv),
    points: pointsOf(ml, abv),
  };
}

function run(drinks: Drink[], now: number, deletedDrinks: Drink[] = []) {
  const input: EngineInput = { players, drinks, deletedDrinks, now };
  const r = evaluateAchievements(input);
  const get = (id: string, playerId: number) =>
    r.summaries.find((s) => s.definition.id === id)!.unlocks.find((u) => u.playerId === playerId);
  return { r, get };
}

describe("achievement engine", () => {
  it("timestamps unlocks with the drink time and lists the newest first", () => {
    const { r, get } = run([drink(1, fri(20)), drink(2, fri(21, 30))], fri(23));
    expect(get("first-round", 1)?.at).toBe(fri(20));
    expect(get("first-round", 2)?.at).toBe(fri(21, 30));
    expect(r.recent[0].at).toBeGreaterThanOrEqual(r.recent[r.recent.length - 1].at);
    // Rarity is over players with a drink: 2 of 2.
    expect(r.summaries.find((s) => s.definition.id === "first-round")!.rarity).toBe(1);
  });

  it("Prost! needs 3 others within 2 minutes and unlocks when the third drinks", () => {
    const { get } = run(
      [drink(1, fri(21, 0)), drink(2, fri(21, 1)), drink(3, fri(21, 1)), drink(4, fri(21, 2)), drink(5, fri(21, 30))],
      fri(23),
    );
    expect(get("prost", 1)?.at).toBe(fri(21, 2));
    expect(get("prost", 4)?.at).toBe(fri(21, 2));
    expect(get("prost", 5)).toBeUndefined();
  });

  it("Block Champion counts completed blocks only and unlocks at the block end", () => {
    const drinks = [drink(1, fri(18, 10)), drink(1, fri(19, 20)), drink(2, fri(20, 30))];
    expect(run(drinks, fri(20, 50)).get("hour-champion", 1)).toBeUndefined();
    expect(run(drinks, fri(21, 5)).get("hour-champion", 1)?.at).toBe(fri(21));
    expect(run(drinks, fri(21, 5)).get("hour-champion", 2)).toBeUndefined();
  });

  it("Early Bird goes to the first drinker of the day only", () => {
    const { get } = run([drink(2, fri(12)), drink(1, fri(13))], fri(15));
    expect(get("early-bird", 2)?.at).toBe(fri(12));
    expect(get("early-bird", 1)).toBeUndefined();
  });

  it("Century: everyone who drank on a 100-point day gets it, when they drank", () => {
    // 53 halbe at ~1.9 points each by Anna is over 100 points.
    const big = Array.from({ length: 56 }, (_, i) => drink(1, fri(14) + i * 10 * 60_000));
    const { get } = run([...big, drink(2, fri(23))], fri(23, 30));
    expect(get("century", 1)).toBeDefined();
    expect(get("century", 2)?.at).toBe(fri(23));
    expect(get("century", 3)).toBeUndefined();
  });

  it("Last One Standing waits until the night is settled", () => {
    const drinks = [drink(1, fri(23)), drink(2, fri(24 + 3))]; // 03:00 Saturday
    const early = run(drinks, fri(24 + 4));
    expect(early.get("last-one-standing", 2)).toBeUndefined();
    const late = run(drinks, fri(24 + 6));
    expect(late.get("last-one-standing", 2)?.at).toBe(fri(24 + 5));
    expect(late.get("last-one-standing", 1)).toBeUndefined();
  });

  it("Completionist counts the other 30 achievements", () => {
    const { r, get } = run([drink(1, fri(20))], fri(21));
    expect(r.summaries).toHaveLength(31);
    const mine = r.byPlayer.get(1)!.find((a) => a.definition.id === "completionist")!;
    expect(mine.progress?.[1]).toBe(30);
    expect(get("completionist", 1)).toBeUndefined();
  });

  it("uses each achievement's fixed tier, not how many people have it", () => {
    const { r } = run([drink(1, fri(20)), drink(2, fri(20, 30))], fri(21));
    const first = r.summaries.find((s) => s.definition.id === "first-round")!;
    expect(first.rarity).toBe(1);
    expect(first.tier).toBe("common");
    expect(r.summaries.find((s) => s.definition.id === "completionist")!.tier).toBe("ultra");
  });

  it("counts a custom drink marked as Glühwein, Jäger or Weizen like the real thing", () => {
    const custom = { drinkTypeId: 99, category: "Wine" as const, name: "Mum's Punch", kind: "gluhwein" as const };
    const { get } = run([drink(1, fri(16), custom), drink(2, fri(16), { ...custom, kind: null })], fri(17));
    expect(get("christkindl", 1)).toBeDefined();
    expect(get("christkindl", 2)).toBeUndefined();
    const shots = Array.from({ length: 5 }, (_, i) =>
      drink(1, fri(20) + i * 60_000, { drinkTypeId: 98, category: "Shots", name: "Kräuter", ml: 20, abv: 35, kind: "jager" }),
    );
    expect(run(shots, fri(21)).get("jager-squad", 1)).toBeDefined();
    const wheat = drink(1, fri(9), { drinkTypeId: 97, name: "Hefe", kind: "weizen" });
    expect(run([wheat], fri(13)).get("weisswurst-breakfast", 1)).toBeDefined();
  });

  it("never looks at who logged the drink", () => {
    const a = run([drink(1, fri(20))], fri(21));
    const b = run([{ ...drink(1, fri(20)), loggedByPlayerId: 2 }], fri(21));
    expect(b.r.recent.map((u) => u.achievementId)).toEqual(a.r.recent.map((u) => u.achievementId));
  });

  it("Dynasty needs consecutive blocks", () => {
    const drinks = [drink(1, fri(18, 5)), drink(1, fri(21, 5)), drink(1, fri(24, 5))];
    expect(run(drinks, fri(27, 30)).get("dynasty", 1)?.at).toBe(fri(27));
    const gap = [drink(1, fri(15, 5)), drink(1, fri(18, 5)), drink(1, fri(24, 5))];
    expect(run(gap, fri(30)).get("dynasty", 1)).toBeUndefined();
    expect(HOUR_MS).toBe(3_600_000);
  });

  it("Half Century unlocks on the 50th drink", () => {
    const ds = Array.from({ length: 50 }, (_, i) => drink(1, fri(12) + i * 60_000));
    expect(run(ds, fri(14)).get("half-century", 1)?.at).toBe(fri(12) + 49 * 60_000);
    expect(run(ds.slice(0, 49), fri(14)).get("half-century", 1)).toBeUndefined();
    expect(run(ds, fri(14)).get("quarter-century", 1)?.at).toBe(fri(12) + 24 * 60_000);
  });

  it("Night Shift needs a drink in each hour from 22:00 to 03:xx on one night", () => {
    const hours = [22, 23, 24, 25, 26, 27];
    const ds = hours.map((h) => drink(1, fri(h, 10)));
    expect(run(ds, fri(30)).get("night-shift", 1)?.at).toBe(fri(27, 10));
    expect(run(ds.slice(0, 5), fri(30)).get("night-shift", 1)).toBeUndefined();
  });

  it("Zombie Mode needs 03-06 and 06-10 drinks on the same morning", () => {
    expect(run([drink(1, fri(24 + 4)), drink(1, fri(24 + 7))], fri(24 + 12)).get("zombie-mode", 1)?.at).toBe(fri(24 + 7));
    expect(run([drink(1, fri(24 + 4)), drink(1, fri(48 + 7))], fri(48 + 12)).get("zombie-mode", 1)).toBeUndefined();
    expect(run([drink(1, fri(24 + 4)), drink(1, fri(24 + 11))], fri(24 + 12)).get("zombie-mode", 1)).toBeUndefined();
  });


});

describe("Glühwein achievements", () => {
  const gw = (playerId: number, at: number) => drink(playerId, at, { name: "Glühwein", category: "Wine", ml: 200, abv: 10 });

  it("Christkindl, Warm Hands and the per-day counts use the 06:00 day", () => {
    // Five Glühweins from 22:00 to 02:00 count as one day.
    const drinks = [gw(1, fri(22)), gw(1, fri(23)), gw(1, fri(0, 0, 28)), gw(1, fri(1, 0, 28)), gw(1, fri(2, 0, 28))];
    const { get } = run(drinks, fri(3, 0, 28));
    expect(get("christkindl", 1)?.at).toBe(fri(22));
    expect(get("warm-hands", 1)?.at).toBe(fri(0, 0, 28));
    expect(get("gluhwein-five", 1)?.at).toBe(fri(2, 0, 28));
    expect(get("rudolph", 1)).toBeUndefined();
  });

  it("Rudolph needs 10 in one day", () => {
    const drinks = Array.from({ length: 10 }, (_, i) => gw(2, fri(12) + i * 20 * 60_000));
    expect(run(drinks, fri(20)).get("rudolph", 2)?.at).toBe(fri(15));
  });

  it("Market Crawl needs 3 different blocks on one day", () => {
    const two = [gw(3, fri(12, 30)), gw(3, fri(14, 30)), gw(3, fri(16))];
    expect(run(two, fri(20)).get("market-crawl", 3)).toBeUndefined();
    const three = [...two, gw(3, fri(19))];
    expect(run(three, fri(20)).get("market-crawl", 3)?.at).toBe(fri(19));
  });

  it("Glühwein Weekend needs one on each trip day", () => {
    const drinks = [gw(4, fri(20)), gw(4, fri(20, 0, 28)), gw(4, fri(1, 0, 30))];
    // The last one is Mon 01:00, which still belongs to Sunday's day.
    expect(run(drinks, fri(2, 0, 30)).get("gluhwein-weekend", 4)?.at).toBe(fri(1, 0, 30));
  });
});

describe("hidden achievements", () => {
  it("Déjà Vu: 5 of the same in a row", () => {
    const five = Array.from({ length: 5 }, (_, i) => drink(1, fri(18 + i)));
    expect(run(five, fri(23, 30)).get("deja-vu", 1)?.at).toBe(fri(22));
    const broken = [...five.slice(0, 4), drink(1, fri(22), { name: "Shot", category: "Shots", drinkTypeId: 9 }), drink(1, fri(23))];
    expect(run(broken, fri(23, 30)).get("deja-vu", 1)).toBeUndefined();
  });

  it("Brak: 10 drinks in 3 blocks, then 3 empty blocks, unlocked when the 3rd empty block ends", () => {
    // Blocks 12–15, 15–18, 18–21 with 10 drinks, then nothing in 21–24, 00–03, 03–06.
    const busy = Array.from({ length: 10 }, (_, i) => drink(1, fri(12) + i * 50 * 60_000));
    expect(run(busy, fri(5, 0, 28)).get("brak", 1)).toBeUndefined();
    expect(run(busy, fri(7, 0, 28)).get("brak", 1)?.at).toBe(fri(6, 0, 28));
    // A drink in the quiet blocks spoils it.
    expect(run([...busy, drink(1, fri(1, 0, 28))], fri(7, 0, 28)).get("brak", 1)).toBeUndefined();
  });
});
