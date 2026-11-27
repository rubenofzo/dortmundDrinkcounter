import clsx from "clsx";
import Link from "next/link";
import { ShowMore } from "@/components/ShowMore";
import { PlayerDot } from "@/components/ui";
import { formatPoints } from "@/lib/drinks";
import type { Ranked } from "@/lib/leaderboard";

/**
 * Compact ranking rows (48px, one line each) so a big group still fits on a phone. Rank 1 gets the
 * red accent, your own row a red outline; `crowned` marks leaders of a finished 3-hour block.
 * `limit` cuts the list (your row is still added below when you're outside it); `fold` shows that
 * many rows and folds the rest behind "Show all".
 */
export function RankingList({
  rows,
  crowned = false,
  limit,
  fold,
  meId,
}: {
  rows: Ranked[];
  crowned?: boolean;
  limit?: number;
  fold?: number;
  meId?: number;
}) {
  let shown = limit ? rows.slice(0, limit) : rows;
  if (limit && meId !== undefined && !shown.some((r) => r.player.id === meId)) {
    const mine = rows.find((r) => r.player.id === meId);
    if (mine) shown = [...shown, mine];
  }
  const cut = fold && shown.length > fold + 2 ? fold : shown.length;
  const head = shown.slice(0, cut);
  const rest = shown.slice(cut);
  const item = (r: Ranked, i: number, list: Ranked[]) => (
    <Row key={r.player.id} r={r} crowned={crowned} me={r.player.id === meId} gap={i > 0 && r.rank > list[i - 1].rank + 1} />
  );
  return (
    <>
      <ol className="flex flex-col gap-1.5">{head.map((r, i) => item(r, i, head))}</ol>
      {rest.length > 0 && (
        <ShowMore label={`Show all ${shown.length}`}>
          <ol className="mt-1.5 flex flex-col gap-1.5">{rest.map((r, i) => item(r, i, rest))}</ol>
        </ShowMore>
      )}
    </>
  );
}

function Row({ r, crowned, me, gap }: { r: Ranked; crowned: boolean; me: boolean; gap: boolean }) {
  const lead = r.rank === 1;
  return (
    <li className={gap ? "mt-2 border-t border-dashed border-line pt-2" : undefined}>
      <Link
        href={`/people/${r.player.slug}`}
        className={clsx(
          "flex min-h-12 items-center gap-2.5 rounded-xl px-3 transition-colors md:min-h-14 md:gap-3 md:px-5",
          lead ? "bg-accent text-foam" : "bg-hall-light/60 text-foam hover:bg-hall-light",
          me && !lead && "ring-2 ring-accent ring-inset",
        )}
      >
        <span className={clsx("w-7 flex-none text-center font-display text-[20px] leading-none md:text-[26px]", lead ? "text-foam" : "text-mist")}>
          {r.rank}
        </span>
        <PlayerDot color={r.player.color} size={10} on="hall" />
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate text-[16px] font-bold md:text-lg">{r.player.name}</span>
          {crowned && lead && (
            <span aria-label="Block champion" className="text-gold">
              👑
            </span>
          )}
          {me && <span className="text-[10px] font-bold tracking-widest text-accent-light uppercase">you</span>}
          <span className={clsx("flex-none text-[12px]", lead ? "text-foam/80" : "text-mist")}>
            <span aria-hidden>{r.topIcon}</span> {r.drinks}
          </span>
        </span>
        <span className="tabular text-right font-display text-[22px] leading-none md:text-[28px]">
          {formatPoints(r.points)}
          <span className={clsx("ml-1 font-sans text-[10px] font-semibold uppercase", lead ? "text-foam/80" : "text-mist")}>pts</span>
        </span>
      </Link>
    </li>
  );
}
