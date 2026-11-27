import type { Metadata } from "next";
import { LeaderboardView, type Tab } from "@/components/LeaderboardView";
import { getHub } from "@/lib/data";
import { getMe } from "@/lib/identity";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; h?: string; d?: string }>;
}) {
  const sp = await searchParams;
  const hub = await getHub();
  const tab: Tab = sp.tab === "day" || sp.tab === "weekend" ? sp.tab : "hour";
  const h = sp.h && /^\d+$/.test(sp.h) ? Number(sp.h) : undefined;
  const me = await getMe(hub);
  return <LeaderboardView hub={hub} tab={tab} h={h} d={sp.d} meId={me?.id} />;
}
