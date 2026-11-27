import type { Drink, Player } from "@/lib/data";
import { blockWinners } from "@/lib/leaderboard";
import { berlinParts, blockEnd, blockStart, dayKey, HOUR_MS, hourStart } from "@/lib/time";
import { achievements as defaultDefinitions } from "./definitions";
import { TIER_LABEL, type RarityTier } from "./rarity";
import type { AchievementContext, AchievementDefinition, DayInfo } from "./types";

export { TIER_LABEL };
export type { RarityTier };

/** The part of the hub the engine reads. */
export type EngineInput = {
  players: Player[];
  drinks: Drink[];
  deletedDrinks: Drink[];
  now: number;
};

export type Unlock = {
  achievementId: string;
  playerId: number;
  /** When it was earned, ms (the drink's time, or the end of the block for block-based ones). */
  at: number;
};

export type PlayerAchievement = {
  definition: AchievementDefinition;
  unlocked: Unlock | null;
  progress: [number, number] | null;
  rarity: number;
  tier: RarityTier;
};

export type AchievementSummary = {
  definition: AchievementDefinition;
  /** Share of players with at least one drink who earned it, 0-1. */
  rarity: number;
  tier: RarityTier;
  /** Oldest first. */
  unlocks: Unlock[];
};

export type AchievementResults = {
  summaries: AchievementSummary[];
  byPlayer: Map<number, PlayerAchievement[]>;
  /** Every unlock, newest first. */
  recent: Unlock[];
};

/** When the 06:00-to-06:00 day `key` ends (06:00 the next morning, Berlin), ms. */
export function dayEndMs(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  // 03:00 UTC of the next date is before 06:00 Berlin whatever the offset; step to 06:00 local.
  let ms = Date.UTC(y, m - 1, d + 1, 3);
  while (berlinParts(ms).hour < 6) ms += HOUR_MS;
  return hourStart(ms);
}

/**
 * Replays the weekend in time order. The moments that are looked at are every drink, every
 * undo, the end of every hour that had a drink, 2 hours after every drink, 3 blocks after every drink's block and the end of every
 * day (so group and block-based achievements settle at the right time), plus `now`. At each
 * moment every player who has drunk is checked, repeating until nothing new unlocks.
 */
export function evaluateAchievements(
  hub: EngineInput,
  definitions: AchievementDefinition[] = defaultDefinitions,
): AchievementResults {
  const sorted = [...hub.drinks].sort((a, b) => a.at - b.at || a.id - b.id);
  const deleted = [...hub.deletedDrinks]
    .filter((d) => d.deletedAt !== null)
    .sort((a, b) => a.deletedAt! - b.deletedAt!);

  const times = new Set<number>([hub.now]);
  for (const d of sorted) {
    times.add(d.at);
    times.add(blockEnd(blockStart(d.at)));
    times.add(d.at + 2 * HOUR_MS);
    times.add(dayEndMs(dayKey(d.at)));
    // End of the third whole block after this drink's block (Brak settles then).
    let quiet = blockEnd(blockStart(d.at));
    for (let i = 0; i < 3; i++) quiet = blockEnd(quiet);
    times.add(quiet);
  }
  for (const d of deleted) times.add(d.deletedAt!);
  const timeline = [...times].filter((t) => t <= hub.now).sort((a, b) => a - b);

  const soFar: Drink[] = [];
  const mineBy = new Map<number, Drink[]>();
  const deletedCount = new Map<number, number>();
  const unlockedIds = new Map<number, Set<string>>();
  const unlocked = new Map<string, Unlock>(); // `${achievementId}:${playerId}`
  const lastContext = new Map<number, AchievementContext>();
  const dayMap = new Map<string, DayInfo>();
  let di = 0;
  let xi = 0;

  for (const at of timeline) {
    while (di < sorted.length && sorted[di].at <= at) {
      const d = sorted[di++];
      soFar.push(d);
      if (!mineBy.has(d.playerId)) mineBy.set(d.playerId, []);
      mineBy.get(d.playerId)!.push(d);
      addToDay(dayMap, d);
    }
    while (xi < deleted.length && deleted[xi].deletedAt! <= at) {
      const d = deleted[xi++];
      deletedCount.set(d.playerId, (deletedCount.get(d.playerId) ?? 0) + 1);
    }
    const winners = blockWinners(soFar, at);

    for (const player of hub.players) {
      const mine = mineBy.get(player.id);
      if (!mine?.length) continue;
      const earned = unlockedIds.get(player.id) ?? new Set<string>();
      unlockedIds.set(player.id, earned);
      const ctx: AchievementContext = {
        player,
        at,
        drinks: soFar,
        mine,
        deletedCount: deletedCount.get(player.id) ?? 0,
        blockWins: [...winners]
          .filter(([, ids]) => ids.includes(player.id))
          .map(([h]) => h)
          .sort((a, b) => a - b),
        days: dayMap,
        unlockedIds: earned,
      };
      lastContext.set(player.id, ctx);

      // Repeat until nothing new unlocks, so achievements about achievements see the others.
      let changed = true;
      while (changed) {
        changed = false;
        for (const def of definitions) {
          if (earned.has(def.id) || !safeCheck(def, ctx)) continue;
          earned.add(def.id);
          unlocked.set(`${def.id}:${player.id}`, { achievementId: def.id, playerId: player.id, at });
          changed = true;
        }
      }
    }
  }

  const drinkers = hub.players.filter((p) => mineBy.has(p.id));
  const all = [...unlocked.values()];
  const summaries: AchievementSummary[] = definitions.map((definition) => {
    const unlocks = all.filter((u) => u.achievementId === definition.id).sort((a, b) => a.at - b.at || a.playerId - b.playerId);
    const rarity = drinkers.length ? unlocks.length / drinkers.length : 0;
    return { definition, rarity, tier: definition.tier, unlocks };
  });
  const summaryById = new Map(summaries.map((s) => [s.definition.id, s]));

  const byPlayer = new Map<number, PlayerAchievement[]>();
  for (const player of hub.players) {
    const ctx = lastContext.get(player.id);
    byPlayer.set(
      player.id,
      definitions.map((definition) => {
        const summary = summaryById.get(definition.id)!;
        const unlock = unlocked.get(`${definition.id}:${player.id}`) ?? null;
        let progress: [number, number] | null = null;
        if (!unlock && definition.progress && ctx) {
          try {
            const [current, target] = definition.progress(ctx);
            progress = [Math.min(current, target), target];
          } catch {
            progress = null;
          }
        }
        return { definition, unlocked: unlock, progress, rarity: summary.rarity, tier: summary.tier };
      }),
    );
  }

  const order = new Map(definitions.map((d, i) => [d.id, i]));
  const recent = [...all].sort(
    (a, b) => b.at - a.at || (order.get(b.achievementId) ?? 0) - (order.get(a.achievementId) ?? 0),
  );

  return { summaries, byPlayer, recent };
}

/** Folds one drink into the per-day group info (drinks arrive in time order). */
function addToDay(days: Map<string, DayInfo>, d: Drink) {
  const key = dayKey(d.at);
  let day = days.get(key);
  if (!day) {
    day = {
      key,
      points: 0,
      playerIds: new Set(),
      firstIds: new Set([d.playerId]),
      lastIds: new Set(),
      lastAt: d.at,
      endsAt: dayEndMs(key),
    };
    days.set(key, day);
  }
  day.points += d.points;
  (day.playerIds as Set<number>).add(d.playerId);
  if (d.at !== day.lastAt) (day.lastIds as Set<number>).clear();
  day.lastAt = d.at;
  (day.lastIds as Set<number>).add(d.playerId);
}

/** A broken check shouldn't take the whole site down; it just never unlocks. */
function safeCheck(def: AchievementDefinition, ctx: AchievementContext): boolean {
  try {
    return def.check(ctx);
  } catch (err) {
    console.error(`Achievement "${def.id}" threw:`, err);
    return false;
  }
}
