import type { Drink, Player } from "./data";
import { blockLabel, blocksBetween, blockStart, TRIP_START_MS, TRIP_END_MS } from "./time";

/** 3-hour blocks shown for the trip: from the trip start (or the first drink, if earlier) to now. */
export function tripBlocks(drinks: Drink[], now: number): number[] {
  const first = drinks[0]?.at ?? now;
  const from = Math.min(TRIP_START_MS, blockStart(first));
  const to = Math.max(Math.min(now, TRIP_END_MS - 1), drinks.at(-1)?.at ?? 0, from);
  return blocksBetween(from, to);
}

/** Points per 3-hour block per player: Map<blockStartMs, Map<playerId, points>>. */
export function pointsByBlock(drinks: Drink[]): Map<number, Map<number, number>> {
  const out = new Map<number, Map<number, number>>();
  for (const d of drinks) {
    const h = blockStart(d.at);
    const row = out.get(h) ?? new Map<number, number>();
    row.set(d.playerId, (row.get(d.playerId) ?? 0) + d.points);
    out.set(h, row);
  }
  return out;
}

export type ChartPoint = { label: string; [seriesKey: string]: number | string };
export type ChartSeries = { key: string; name: string; color: string };

/**
 * Data for `HourChart`: one point per 3-hour block from the first drink to now, one
 * series per player (only players who drank, or just `only`).
 */
export function blockChartData(
  drinks: Drink[],
  players: Player[],
  now: number,
  only?: number[],
): { points: ChartPoint[]; series: ChartSeries[] } {
  const scoped = only ? drinks.filter((d) => only.includes(d.playerId)) : drinks;
  if (scoped.length === 0) return { points: [], series: [] };
  const ids = new Set(scoped.map((d) => d.playerId));
  const shown = players.filter((p) => ids.has(p.id));
  const series = shown.map((p) => ({ key: `p${p.id}`, name: p.name, color: p.color }));
  const byHour = pointsByBlock(scoped);
  const to = Math.max(now, scoped.at(-1)!.at);
  const points = blocksBetween(scoped[0].at, Math.min(to, TRIP_END_MS)).map((h) => {
    const row = byHour.get(h);
    const point: ChartPoint = { label: blockLabel(h) };
    for (const p of shown) point[`p${p.id}`] = Math.round((row?.get(p.id) ?? 0) * 10) / 10;
    return point;
  });
  return { points, series };
}
