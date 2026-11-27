import { evaluateAchievements } from "@/achievements/engine";
import { unlockToastItems } from "@/lib/achievementViews";
import { getHub } from "@/lib/data";
import { UnlockToast } from "./UnlockToast";

/** Server wrapper for the layout: hands the newest unlocks to the client toast as plain data. */
export async function UnlockToastHost() {
  const hub = await getHub();
  return <UnlockToast items={unlockToastItems(hub, evaluateAchievements(hub))} />;
}
