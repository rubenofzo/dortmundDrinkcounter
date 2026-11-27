import type { AchievementResults, PlayerAchievement, Unlock } from "@/achievements/engine";
import type { AchievementView, AchievementWinner } from "@/components/AchievementDetail";
import type { Hub } from "./data";
import { formatDayTime } from "./time";

/** "42%". */
export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** Who unlocked each achievement, oldest unlock first, ready for the client components. */
function winnersById(hub: Hub, results: AchievementResults): Map<string, AchievementWinner[]> {
  return new Map(
    results.summaries.map((s) => [
      s.definition.id,
      s.unlocks.flatMap((u) => {
        const p = hub.playerById.get(u.playerId);
        if (!p) return [];
        return [{ playerId: p.id, name: p.name, slug: p.slug, color: p.color, date: formatDayTime(u.at) }];
      }),
    ]),
  );
}

/** Hidden and still locked: strip everything that would give it away before it reaches the client. */
function redact(view: AchievementView, index: number): AchievementView {
  return view.secret
    ? { ...view, id: `hidden-${index}`, name: "???", description: "", icon: "?", progress: null, winners: [] }
    : view;
}

/** Every achievement as seen by the group: locked when nobody has it yet. */
export function achievementViews(hub: Hub, results: AchievementResults): AchievementView[] {
  const winners = winnersById(hub, results);
  return results.summaries.map((s, i) => {
    const locked = s.unlocks.length === 0;
    return redact(
      {
        id: s.definition.id,
        name: s.definition.name,
        description: s.definition.description,
        icon: s.definition.icon,
        tier: s.tier,
        rarity: s.rarity,
        locked,
        secret: locked && !!s.definition.hidden,
        progress: null,
        winners: winners.get(s.definition.id) ?? [],
        unlockedDate: null,
        unlockedOrder: null,
      },
      i,
    );
  });
}

/** Every achievement as seen by one player: locked until they have it, with their progress. */
export function playerAchievementViews(hub: Hub, results: AchievementResults, playerId: number): AchievementView[] {
  const winners = winnersById(hub, results);
  return (results.byPlayer.get(playerId) ?? []).map((a: PlayerAchievement, i) =>
    redact(
      {
        id: a.definition.id,
        name: a.definition.name,
        description: a.definition.description,
        icon: a.definition.icon,
        tier: a.tier,
        rarity: a.rarity,
        locked: !a.unlocked,
        secret: !a.unlocked && !!a.definition.hidden,
        progress: a.progress,
        winners: winners.get(a.definition.id) ?? [],
        unlockedDate: a.unlocked ? formatDayTime(a.unlocked.at) : null,
        unlockedOrder: a.unlocked?.at ?? null,
      },
      i,
    ),
  );
}

/** A recent unlock, small and serialisable, for the unlock toast. */
export type UnlockToastItem = { key: string; text: string };

/** The newest unlocks as toast data. `key` is stable per (achievement, player). */
export function unlockToastItems(hub: Hub, results: AchievementResults, limit = 12): UnlockToastItem[] {
  const defs = new Map(results.summaries.map((s) => [s.definition.id, s.definition]));
  return results.recent.slice(0, limit).flatMap((u: Unlock) => {
    const def = defs.get(u.achievementId);
    const p = hub.playerById.get(u.playerId);
    if (!def || !p) return [];
    return [{ key: `${u.achievementId}:${u.playerId}`, text: `🏆 ${p.name} unlocked ${def.name} ${def.icon}` }];
  });
}
