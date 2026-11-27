import { evaluateAchievements } from "@/achievements/engine";
import { playerAchievementViews } from "@/lib/achievementViews";
import { getHub } from "@/lib/data";
import { AchievementShowcase } from "./AchievementShowcase";

/** A player's achievement showcase (server component: loads the hub itself, for the player page). */
export async function PlayerAchievements({ playerId }: { playerId: number }) {
  const hub = await getHub();
  const player = hub.playerById.get(playerId);
  if (!player) return null;
  const views = playerAchievementViews(hub, evaluateAchievements(hub), playerId);
  return <AchievementShowcase items={views} playerName={player.name} />;
}
