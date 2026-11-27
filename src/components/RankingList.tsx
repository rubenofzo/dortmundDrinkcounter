import clsx from "clsx";
import Link from "next/link";
import { PlayerDot } from "@/components/ui";
import { formatPoints } from "@/lib/drinks";
import type { Ranked } from "@/lib/leaderboard";

/**
 * Big phone-friendly ranking rows (≥56px). Rank-1 rows get the red accent; `crowned` marks
 * leaders of a finished hour with a gold crown. `tone` picks dark hall or light foam backing.
 */
export function RankingList({
  rows,
  crowned = false,
  limit,
  tone = "hall",
}: {
  rows: Ranked[];
  crowned?: boolean;
  limit?: number;
  tone?: "hall" | "card";
}) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const card = tone === "card";
  return (
    <ol className="flex flex-col gap-2">
      {shown.map((r) => {
        const lead = r.rank === 1;
        return (
          <li key={r.player.id}>
            <Link
              href={`/people/${r.player.slug}`}
              className={clsx(
                "flex min-h-14 items-center gap-3 rounded-xl px-3.5 py-2 transition-colors md:min-h-16 md:px-5",
                lead
                  ? "bg-accent text-foam"
                  : card
                    ? "bg-foam-line/50 text-ink hover:bg-foam-line"
                    : "bg-hall-light/60 text-foam hover:bg-hall-light",
              )}
            >
              <span
                className={clsx(
                  "w-8 flex-none text-center font-display text-[28px] leading-none md:text-[34px]",
                  lead ? "text-foam" : card ? "text-ink-muted" : "text-mist",
                )}
              >
                {r.rank}
              </span>
              <PlayerDot color={r.player.color} size={12} on={lead || !card ? "hall" : "card"} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[17px] font-bold md:text-lg">
                  <span className="truncate">{r.player.name}</span>
                  {crowned && lead && (
                    <span aria-label="Hour champion" className="text-gold drop-shadow">
                      👑
                    </span>
                  )}
                </span>
                <span className={clsx("text-[13px]", lead ? "text-foam/80" : card ? "text-ink-muted" : "text-mist")}>
                  <span aria-hidden>{r.topIcon}</span> {r.drinks} {r.drinks === 1 ? "drink" : "drinks"}
                </span>
              </span>
              <span className="text-right font-display text-[26px] leading-none md:text-[32px]">
                {formatPoints(r.points)}
                <span className={clsx("ml-1 text-[11px] font-sans font-semibold uppercase", lead ? "text-foam/80" : "text-mist")}>
                  pts
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
