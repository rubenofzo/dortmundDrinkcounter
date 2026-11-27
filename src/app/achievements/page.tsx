import type { Metadata } from "next";
import { evaluateAchievements } from "@/achievements/engine";
import { AchievementList } from "@/components/AchievementList";
import { PageTitle } from "@/components/ui";
import { achievementViews } from "@/lib/achievementViews";
import { getHub } from "@/lib/data";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const hub = await getHub();
  const views = achievementViews(hub, evaluateAchievements(hub));
  const unlocked = views.filter((a) => !a.locked).length;
  const drinkers = new Set(hub.drinks.map((d) => d.playerId)).size;

  return (
    <main className="flex flex-col gap-3 md:gap-6">
      <div className="flex flex-col gap-1.5 md:gap-1">
        <PageTitle className="uppercase">Achievements</PageTitle>
        <p className="text-[12.5px] text-mist md:text-base">
          <span className="md:hidden">
            {unlocked} of {views.length} unlocked · % is the share of the {drinkers} drinkers who have it
          </span>
          <span className="hidden md:inline">
            Rarity is the share of the {drinkers} drinkers who have earned it.
          </span>
        </p>
      </div>
      <AchievementList achievements={views} playerCount={drinkers} />
    </main>
  );
}
