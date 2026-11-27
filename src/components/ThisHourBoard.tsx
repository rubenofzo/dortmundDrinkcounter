import Link from "next/link";
import { HourCountdown } from "@/components/HourCountdown";
import { RankingList } from "@/components/RankingList";
import { HallPanel, Chevron } from "@/components/ui";
import type { Hub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { rankDrinks } from "@/lib/leaderboard";
import { blockEnd, blockLabel, blockStart, tripClock } from "@/lib/time";

/** Home box: the current 3-hour block's top 3 (plus your own row), a live countdown, link to the leaderboard. */
export function ThisHourBoard({ hub, meId }: { hub: Hub; meId?: number }) {
  const start = blockStart(hub.now);
  const end = blockEnd(start);
  const drinks = hub.drinks.filter((d) => d.at >= start && d.at < end);
  const rows = rankDrinks(drinks, hub.players);
  const points = drinks.reduce((s, d) => s + d.points, 0);
  return (
    <HallPanel>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] leading-tight uppercase md:text-3xl">This block</h2>
          <p className="truncate text-[13px] text-mist">
            {tripClock(hub.now).split(" · ")[0]} · {blockLabel(start)} · {formatPoints(points)} pts
          </p>
        </div>
        <div className="flex-none text-right">
          <HourCountdown endMs={end} seedNow={hub.now} className="tabular font-display text-[26px] leading-none text-accent-light" />
          <p className="text-[10px] font-semibold tracking-wider text-mist uppercase">left</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="py-3 text-mist">Nobody has drunk this block yet. Be the first to take the lead.</p>
      ) : (
        <RankingList rows={rows} limit={3} meId={meId} />
      )}
      <Link href="/leaderboard" className="mt-2 flex min-h-11 items-center justify-between rounded-xl px-1 text-[14px] font-bold text-accent-light hover:bg-hall-light">
        Full leaderboard ({rows.length}) <Chevron />
      </Link>
    </HallPanel>
  );
}
