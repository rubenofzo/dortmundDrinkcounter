import Link from "next/link";
import { PeopleGrid, type TileData } from "@/components/PeopleGrid";
import { LatestFeed } from "@/components/LatestFeed";
import { StillInSystem } from "@/components/StillInSystem";
import { TripStrip } from "@/components/TripStrip";
import { WhoAreYou } from "@/components/WhoAreYou";
import { HourChart } from "@/components/HourChart";
import { GroupStats } from "@/components/GroupStats";
import { ThisHourBoard } from "@/components/ThisHourBoard";
import { HallPanel, SectionTitle } from "@/components/ui";
import { getHub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { roomChartData } from "@/lib/rooms";
import { blockChartData } from "@/lib/hours";
import { getMe } from "@/lib/identity";
import { loadAt } from "@/lib/metabolism";
import { blockStart, dayKey } from "@/lib/time";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ pick?: string }> }) {
  const [hub, sp] = await Promise.all([getHub(), searchParams]);
  const me = await getMe(hub);
  const picking = !me || sp.pick === "1";

  const today = dayKey(hub.now);
  const thisBlock = blockStart(hub.now);
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
        load: formatPoints(loadAt(mine, hub.now) / 10),
      };
    })
    .sort((a, b) => Number(b.isMe) - Number(a.isMe));

  const menu = hub.drinkTypes.filter((t) => !t.hidden);
  const chart = blockChartData(hub.drinks, hub.players, hub.now);
  const roomChart = roomChartData(hub);
  const totalPoints = hub.drinks.reduce((s, d) => s + d.points, 0);
  const hourPoints = hub.drinks.filter((d) => blockStart(d.at) === thisBlock).reduce((s, d) => s + d.points, 0);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <TripStrip now={hub.now} drinks={hub.drinks.length} points={formatPoints(totalPoints)} hourPoints={formatPoints(hourPoints)} />
      <PeopleGrid tiles={tiles} menu={menu} />
      <ThisHourBoard hub={hub} meId={me?.id} />
      <LatestFeed hub={hub} />
      <HallPanel>
        <SectionTitle className="mb-2 uppercase">Points over time</SectionTitle>
        {chart.points.length === 0 ? <p className="text-mist">The chart starts with the first drink.</p> : <HourChart points={chart.points} series={chart.series} />}
      </HallPanel>
      <StillInSystem hub={hub} />
      <HallPanel>
        <SectionTitle className="mb-2 uppercase">Rooms over time</SectionTitle>
        {roomChart.points.length > 0 ? (
          <HourChart points={roomChart.points} series={roomChart.series} />
        ) : (
          <p className="text-mist">
            Make rooms and put people in them on the{" "}
            <Link href="/people" className="font-bold text-accent-light">
              People
            </Link>{" "}
            page to race room against room.
          </p>
        )}
      </HallPanel>
      <GroupStats hub={hub} />
      {picking && <WhoAreYou players={hub.players.map((p) => ({ id: p.id, name: p.name, color: p.color }))} dismissable={!!me} />}
    </div>
  );
}
