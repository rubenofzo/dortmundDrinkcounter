import Link from "next/link";
import { HourCountdown } from "@/components/HourCountdown";
import { RankingList } from "@/components/RankingList";
import { HallPanel, Chevron } from "@/components/ui";
import type { Hub } from "@/lib/data";
import { rankDrinks } from "@/lib/leaderboard";
import { HOUR_MS, hourLabel, hourStart } from "@/lib/time";

/** Home box: the current hour's top 5, a live countdown to the hour's end, link to the leaderboard. */
export function ThisHourBoard({ hub }: { hub: Hub }) {
  const start = hourStart(hub.now);
  const end = start + HOUR_MS;
  const rows = rankDrinks(
    hub.drinks.filter((d) => d.at >= start && d.at < end),
    hub.players,
  );
  return (
    <HallPanel>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] leading-tight uppercase md:text-3xl">This hour</h2>
          <p className="text-[13px] text-mist">{hourLabel(start)}</p>
        </div>
        <div className="text-right">
          <HourCountdown endMs={end} seedNow={hub.now} className="font-display text-[32px] leading-none text-accent-light" />
          <p className="text-[11px] font-semibold tracking-wider text-mist uppercase">left</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="py-3 text-mist">Nobody has drunk this hour yet. Be the first to take the lead.</p>
      ) : (
        <RankingList rows={rows} limit={5} />
      )}
      <Link
        href="/leaderboard"
        className="mt-3 flex min-h-14 items-center justify-between rounded-xl border border-line px-4 font-bold hover:bg-hall-light"
      >
        Full leaderboard <Chevron />
      </Link>
    </HallPanel>
  );
}
