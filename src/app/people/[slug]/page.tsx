import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrinkLog } from "@/components/DrinkLog";
import { HourChart } from "@/components/HourChart";
import { PersonHero } from "@/components/PersonHero";
import { PlayerAchievements } from "@/components/PlayerAchievements";
import { StatTiles } from "@/components/StatTiles";
import { HallPanel, SectionTitle } from "@/components/ui";
import { getHub } from "@/lib/data";
import { hourChartData } from "@/lib/hours";
import { playerStats } from "@/lib/stats";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { players } = await getHub();
  return { title: players.find((p) => p.slug === slug)?.name ?? "Person" };
}

export default async function PersonPage({ params }: Props) {
  const { slug } = await params;
  const hub = await getHub();
  const player = hub.players.find((p) => p.slug === slug);
  if (!player) notFound();

  const mine = hub.drinks.filter((d) => d.playerId === player.id);
  const stats = playerStats(mine, hub.now);
  const chart = hourChartData(hub.drinks, hub.players, hub.now, [player.id]);

  return (
    <main className="flex flex-col gap-4 md:gap-8">
      <Link href="/people" className="-mb-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-accent md:min-h-0 md:text-sm">
        ← All people
      </Link>
      <PersonHero player={player} s={stats} />
      <StatTiles s={stats} />
      <PlayerAchievements playerId={player.id} />
      <HallPanel className="flex flex-col gap-3">
        <SectionTitle className="uppercase">Points per hour</SectionTitle>
        <HourChart points={chart.points} series={chart.series} />
      </HallPanel>
      <section className="flex flex-col gap-3">
        <SectionTitle className="uppercase">Drink log</SectionTitle>
        <DrinkLog drinks={mine} players={hub.players} />
      </section>
    </main>
  );
}
