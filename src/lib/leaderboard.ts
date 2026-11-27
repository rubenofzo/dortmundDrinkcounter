import type { Drink, Player } from "./data";
import { blockEnd, blockStart } from "./time";

export type Ranked = { player: Player; points: number; drinks: number; topIcon: string; rank: number };

const EPS = 1e-9;

/** Ranking of these drinks: only players with ≥1 drink, points desc (then name), ties share the rank (1,1,3). */
export function rankDrinks(drinks: Drink[], players: Player[]): Ranked[] {
  const byPlayer = new Map<number, { points: number; drinks: number; icons: Map<string, number> }>();
  for (const d of drinks) {
    const row = byPlayer.get(d.playerId) ?? { points: 0, drinks: 0, icons: new Map<string, number>() };
    row.points += d.points;
    row.drinks += 1;
    row.icons.set(d.icon, (row.icons.get(d.icon) ?? 0) + 1);
    byPlayer.set(d.playerId, row);
  }
  const rows = players
    .filter((p) => byPlayer.has(p.id))
    .map((player) => {
      const r = byPlayer.get(player.id)!;
      // Most frequent icon (first seen wins a tie).
      let topIcon = "🍺";
      let best = 0;
      for (const [icon, n] of r.icons) if (n > best) {
          best = n;
          topIcon = icon;
        }
      return { player, points: r.points, drinks: r.drinks, topIcon, rank: 0 };
    })
    .sort((a, b) => b.points - a.points || a.player.name.localeCompare(b.player.name));
  rows.forEach((r, i) => {
    r.rank = i > 0 && Math.abs(rows[i - 1].points - r.points) < EPS ? rows[i - 1].rank : i + 1;
  });
  return rows;
}

/**
 * Winners per COMPLETED 3-hour block (block end <= now) that had drinks:
 * Map<blockStartMs, playerId[]> (ties all win), ordered by time.
 */
export function blockWinners(drinks: Drink[], now: number): Map<number, number[]> {
  const perHour = new Map<number, Map<number, number>>();
  for (const d of drinks) {
    const h = blockStart(d.at);
    if (blockEnd(h) > now) continue;
    const row = perHour.get(h) ?? new Map<number, number>();
    row.set(d.playerId, (row.get(d.playerId) ?? 0) + d.points);
    perHour.set(h, row);
  }
  const out = new Map<number, number[]>();
  for (const h of [...perHour.keys()].sort((a, b) => a - b)) {
    const row = perHour.get(h)!;
    const max = Math.max(...row.values());
    out.set(
      h,
      [...row].filter(([, p]) => max - p < EPS).map(([id]) => id),
    );
  }
  return out;
}
