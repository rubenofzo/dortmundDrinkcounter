import { PeopleGrid, type TileData } from "@/components/PeopleGrid";
import { LatestFeed } from "@/components/LatestFeed";
import { StillInSystem } from "@/components/StillInSystem";
import { WhoAreYou } from "@/components/WhoAreYou";
import { HourChart } from "@/components/HourChart";
import { GroupStats } from "@/components/GroupStats";
import { ThisHourBoard } from "@/components/ThisHourBoard";
import { HallPanel, SectionTitle } from "@/components/ui";
import { getHub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { blockChartData } from "@/lib/hours";
import { getMe } from "@/lib/identity";
import { dayKey } from "@/lib/time";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ pick?: string }> }) {
  const [hub, sp] = await Promise.all([getHub(), searchParams]);
  const me = await getMe(hub);
  const picking = !me || sp.pick === "1";

  const today = dayKey(hub.now);
  const tiles: TileData[] = hub.players
    .map((p) => {
      const mine = hub.drinks.filter((d) => d.playerId === p.id);
      const todays = mine.filter((d) => dayKey(d.at) === today);
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        isMe: p.id === me?.id,
        todayPoints: formatPoints(todays.reduce((s, d) => s + d.points, 0)),
        todayCount: todays.length,
      };
    });

  const menu = hub.drinkTypes.filter((t) => !t.hidden);
  const chart = blockChartData(hub.drinks, hub.players, hub.now);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PeopleGrid tiles={tiles} menu={menu} />
      <ThisHourBoard hub={hub} meId={me?.id} />
      <LatestFeed hub={hub} />
      <HallPanel>
        <SectionTitle className="mb-2 uppercase">Points per 3 hours</SectionTitle>
        {chart.points.length === 0 ? <p className="text-mist">The chart starts with the first drink.</p> : <HourChart points={chart.points} series={chart.series} />}
      </HallPanel>
      <StillInSystem hub={hub} />
      <GroupStats hub={hub} />
      {picking && <WhoAreYou players={hub.players.map((p) => ({ id: p.id, name: p.name, color: p.color }))} dismissable={!!me} />}
    </div>
  );
}
