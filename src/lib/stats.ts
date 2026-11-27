import type { Drink, Player } from "./data";
import { PILS_HALBE_POINTS, pureMlOf } from "./drinks";
import { loadAt, loadCurve, peakLoad, processedBy } from "./metabolism";
import { berlinParts, blockStart, dayKey, HOUR_MS, hourStart } from "./time";

/*
 * Fun stats: pure functions over drinks. Nothing here looks at `loggedByPlayerId`: a drink
 * belongs to whoever drank it. Pass one person's drinks to the `player*` helpers.
 */

export type Totals = { drinks: number; points: number; pureMl: number; liters: number; beerEquivalent: number };

export function totals(drinks: Drink[]): Totals {
  let points = 0;
  let pureMl = 0;
  let ml = 0;
  for (const d of drinks) {
    points += d.points;
    pureMl += pureMlOf(d.ml, d.abv);
    ml += d.ml;
  }
  return { drinks: drinks.length, points, pureMl, liters: ml / 1000, beerEquivalent: points / PILS_HALBE_POINTS };
}

/** A fun comparison for a volume in litres. */
export function litreComparison(liters: number): string {
  if (liters <= 0) return "not even a sip yet";
  if (liters < 1) return "less than a bottle of cola";
  if (liters < 2.5) return "a big bottle of cola";
  if (liters < 6) return `${Math.round(liters / 1.5)} big water bottles`;
  if (liters < 20) return "a few big water bottles and a bucket";
  if (liters < 50) return "a small beer keg";
  return "a whole beer keg and then some";
}

/** Points per 3-hour leaderboard block: Map<blockStartMs, points>. */
function hourTotals(drinks: Drink[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const d of drinks) m.set(blockStart(d.at), (m.get(blockStart(d.at)) ?? 0) + d.points);
  return m;
}

/** The best 3-hour block (most points; `hour` is the block start); ties go to the earlier block. */
export function bestHour(drinks: Drink[]): { hour: number; points: number } | null {
  let best: { hour: number; points: number } | null = null;
  for (const [hour, points] of [...hourTotals(drinks)].sort((a, b) => a[0] - b[0])) {
    if (!best || points > best.points) best = { hour, points };
  }
  return best;
}

/** Longest run of consecutive hour buckets with at least one drink. */
export function longestStreak(drinks: Drink[]): { hours: number; from: number } | null {
  const hours = [...new Set(drinks.map((d) => hourStart(d.at)))].sort((a, b) => a - b);
  let best: { hours: number; from: number } | null = null;
  let run = 0;
  let from = 0;
  hours.forEach((h, i) => {
    if (i > 0 && h - hours[i - 1] === HOUR_MS) run++;
    else {
      run = 1;
      from = h;
    }
    if (!best || run > best.hours) best = { hours: run, from };
  });
  return best;
}

/** Day with the first and last drink (with time), oldest day first. */
export type DayEdge = { day: string; first: Drink; last: Drink };

export function dayEdges(drinks: Drink[]): DayEdge[] {
  const byDay = new Map<string, DayEdge>();
  for (const d of [...drinks].sort((a, b) => a.at - b.at || a.id - b.id)) {
    const key = dayKey(d.at);
    const e = byDay.get(key);
    if (!e) byDay.set(key, { day: key, first: d, last: d });
    else e.last = d;
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/** Berlin 12:00 of a day key, in ms. */
function noonOf(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 12);
  return guess - (berlinParts(guess).hour - 12) * HOUR_MS;
}

/**
 * Longest gap between two consecutive drinks of one day, clipped to the 12:00–02:00 window.
 * Time before the first drink and after the last one is not counted.
 */
export function longestDrySpell(drinks: Drink[]): { ms: number; from: number; to: number } | null {
  const byDay = new Map<string, Drink[]>();
  for (const d of drinks) byDay.set(dayKey(d.at), [...(byDay.get(dayKey(d.at)) ?? []), d]);
  let best: { ms: number; from: number; to: number } | null = null;
  for (const [key, list] of byDay) {
    const start = noonOf(key);
    const end = start + 14 * HOUR_MS;
    list.sort((a, b) => a.at - b.at);
    for (let i = 1; i < list.length; i++) {
      const from = Math.max(list[i - 1].at, start);
      const to = Math.min(list[i].at, end);
      if (to > from && (!best || to - from > best.ms)) best = { ms: to - from, from, to };
    }
  }
  return best;
}

/** Points and counts per category, biggest first. */
export function categoryMix(drinks: Drink[]): { category: string; count: number; points: number }[] {
  const m = new Map<string, { category: string; count: number; points: number }>();
  for (const d of drinks) {
    const e = m.get(d.category) ?? { category: d.category, count: 0, points: 0 };
    e.count++;
    e.points += d.points;
    m.set(d.category, e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count || b.points - a.points);
}

/** The most-drunk drink by name (ties: more points, then name). */
export function favouriteDrink(drinks: Drink[]): { name: string; icon: string; count: number } | null {
  const m = new Map<string, { name: string; icon: string; count: number; points: number }>();
  for (const d of drinks) {
    const e = m.get(d.name) ?? { name: d.name, icon: d.icon, count: 0, points: 0 };
    e.count++;
    e.points += d.points;
    m.set(d.name, e);
  }
  const top = [...m.values()].sort((a, b) => b.count - a.count || b.points - a.points || a.name.localeCompare(b.name))[0];
  return top ? { name: top.name, icon: top.icon, count: top.count } : null;
}

/** Points per hour since the first drink of the current day (the day of `now`, else the latest drink's day). */
export function pace(drinks: Drink[], now: number): { perHour: number; since: number } | null {
  if (drinks.length === 0) return null;
  const today = dayKey(now);
  const key = drinks.some((d) => dayKey(d.at) === today) ? today : dayKey(drinks.reduce((a, b) => (b.at > a.at ? b : a)).at);
  const day = drinks.filter((d) => dayKey(d.at) === key);
  const since = Math.min(...day.map((d) => d.at));
  const until = Math.max(now, ...day.map((d) => d.at));
  const hours = Math.max(1, (until - since) / HOUR_MS); // under an hour in, count it as one hour
  return { perHour: day.reduce((s, d) => s + d.points, 0) / hours, since };
}

export type Metabolism = {
  current: number;
  peak: { grams: number; at: number } | null;
  processed: number;
  curve: { at: number; grams: number }[];
};

export function metabolism(drinks: Drink[], now: number): Metabolism {
  return {
    current: loadAt(drinks, now),
    peak: peakLoad(drinks, now),
    processed: processedBy(drinks, now),
    curve: loadCurve(drinks, now - 12 * HOUR_MS, now),
  };
}

/** Everything for one person's page. `drinks` must be only that person's drinks. */
export function playerStats(drinks: Drink[], now: number) {
  return {
    ...totals(drinks),
    pace: pace(drinks, now),
    bestHour: bestHour(drinks),
    favourite: favouriteDrink(drinks),
    mix: categoryMix(drinks),
    streak: longestStreak(drinks),
    days: dayEdges(drinks),
    drySpell: longestDrySpell(drinks),
    load: metabolism(drinks, now),
  };
}
export type PlayerStats = ReturnType<typeof playerStats>;

/** Group-wide records. */
export function groupStats(drinks: Drink[], players: Player[], now: number) {
  const byPlayer = new Map<number, Drink[]>();
  for (const d of drinks) byPlayer.set(d.playerId, [...(byPlayer.get(d.playerId) ?? []), d]);
  const nameOf = (id: number) => players.find((p) => p.id === id);

  // Best of a per-person value; ties go to the lower player id for stable output.
  const best = <T>(pick: (list: Drink[]) => T | null, score: (v: T) => number) => {
    let out: { player: Player; value: T } | null = null;
    for (const [id, list] of [...byPlayer].sort((a, b) => a[0] - b[0])) {
      const p = nameOf(id);
      const v = pick(list);
      if (!p || v === null) continue;
      if (!out || score(v) > score(out.value)) out = { player: p, value: v };
    }
    return out;
  };

  // Biggest single hour by one person.
  let biggestHour: { player: Player; hour: number; points: number } | null = null;
  for (const [id, list] of byPlayer) {
    const p = nameOf(id);
    const h = bestHour(list);
    if (p && h && (!biggestHour || h.points > biggestHour.points)) biggestHour = { player: p, ...h };
  }

  // Early bird / last one standing per day across the whole group.
  const days = dayEdges(drinks).map((e) => ({
    day: e.day,
    early: { player: nameOf(e.first.playerId) ?? null, at: e.first.at },
    late: { player: nameOf(e.last.playerId) ?? null, at: e.last.at },
  }));

  const peak = best((list) => peakLoad(list, now), (v) => v.grams);
  const processed = best((list) => processedBy(list, now), (v) => v);
  const t = totals(drinks);

  return {
    ...t,
    busiestHour: bestHour(drinks),
    biggestHour,
    days,
    peak: peak && { player: peak.player, grams: peak.value.grams, at: peak.value.at },
    mostProcessed: processed && { player: processed.player, grams: processed.value },
    streak: best(longestStreak, (v) => v.hours),
    drySpell: best(longestDrySpell, (v) => v.ms),
    mix: categoryMix(drinks),
    shares: [...byPlayer]
      .map(([id, list]) => ({ player: nameOf(id), points: list.reduce((s, d) => s + d.points, 0), drinks: list.length }))
      .filter((s): s is { player: Player; points: number; drinks: number } => !!s.player)
      .sort((a, b) => b.points - a.points),
  };
}
export type GroupStatsData = ReturnType<typeof groupStats>;
