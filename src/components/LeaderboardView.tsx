import clsx from "clsx";
import Link from "next/link";
import { HallOfHours } from "@/components/HallOfHours";
import { HourStrip, type StripChip } from "@/components/HourStrip";
import { RankingList } from "@/components/RankingList";
import { EmptyState, HallPanel, PageTitle, SectionTitle } from "@/components/ui";
import type { Hub } from "@/lib/data";
import { tripBlocks } from "@/lib/hours";
import { blockWinners, rankDrinks } from "@/lib/leaderboard";
import { blockEnd, blockLabel, blockStart, dayKey, dayLabel, TRIP_DAYS } from "@/lib/time";

export type Tab = "hour" | "day" | "weekend";
const TABS: { key: Tab; label: string }[] = [
  { key: "hour", label: "3 hours" },
  { key: "day", label: "Day" },
  { key: "weekend", label: "Weekend" },
];

/** Leaderboard screen: tabs, chip strip, ranking. All selection lives in the URL. */
export function LeaderboardView({ hub, tab, h, d }: { hub: Hub; tab: Tab; h?: number; d?: string }) {
  const { drinks, players, now } = hub;
  const playerById = new Map(players.map((p) => [p.id, p]));
  const winners = blockWinners(drinks, now);

  let body: React.ReactNode;
  if (tab === "hour") {
    const hours = tripBlocks(drinks, now);
    const current = blockStart(now);
    const fallback = hours.includes(current) ? current : hours[hours.length - 1];
    const sel = h !== undefined && hours.includes(h) ? h : fallback;
    const chips: StripChip[] = hours.map((x) => ({
      key: String(x),
      href: `/leaderboard?tab=hour&h=${x}`,
      label: blockLabel(x),
      crown: winners.has(x),
      live: x === current,
    }));
    const rows = rankDrinks(
      drinks.filter((x) => blockStart(x.at) === sel),
      players,
    );
    const done = blockEnd(sel) <= now;
    body = (
      <>
        <HourStrip chips={chips} selected={String(sel)} />
        <HallPanel>
          <SectionTitle className="mb-3 uppercase">
            {blockLabel(sel)} {sel === current ? "· live" : ""}
          </SectionTitle>
          {rows.length === 0 ? <p className="text-mist">No drinks in this block.</p> : <RankingList rows={rows} crowned={done} />}
        </HallPanel>
        <HallOfHours winners={winners} playerById={playerById} />
      </>
    );
  } else if (tab === "day") {
    const today = dayKey(now);
    const fallback = (TRIP_DAYS as readonly string[]).includes(today) ? today : TRIP_DAYS[0];
    const sel = d && (TRIP_DAYS as readonly string[]).includes(d) ? d : fallback;
    const chips: StripChip[] = TRIP_DAYS.map((k) => ({
      key: k,
      href: `/leaderboard?tab=day&d=${k}`,
      label: dayLabel(k),
      live: k === today,
    }));
    const rows = rankDrinks(
      drinks.filter((x) => dayKey(x.at) === sel),
      players,
    );
    body = (
      <>
        <HourStrip chips={chips} selected={sel} />
        <HallPanel>
          <SectionTitle className="mb-3 uppercase">{dayLabel(sel)}</SectionTitle>
          {rows.length === 0 ? <p className="text-mist">No drinks on this day yet.</p> : <RankingList rows={rows} />}
        </HallPanel>
      </>
    );
  } else {
    const rows = rankDrinks(drinks, players);
    body = (
      <HallPanel>
        <SectionTitle className="mb-3 uppercase">Whole weekend</SectionTitle>
        {rows.length === 0 ? <p className="text-mist">No drinks logged yet.</p> : <RankingList rows={rows} />}
      </HallPanel>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageTitle className="uppercase">Leaderboard</PageTitle>
      <nav className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-hall-panel p-1" aria-label="Leaderboard range">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/leaderboard?tab=${t.key}`}
            scroll={false}
            aria-current={t.key === tab ? "page" : undefined}
            className={clsx(
              "flex min-h-12 items-center justify-center rounded-lg font-display text-lg uppercase",
              t.key === tab ? "bg-accent text-foam" : "text-mist hover:text-foam",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {drinks.length === 0 ? <EmptyState>No drinks yet. The board fills up with the first round.</EmptyState> : body}
    </div>
  );
}
