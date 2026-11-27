import clsx from "clsx";
import Link from "next/link";
import { PlayerDot } from "@/components/ui";
import { formatPoints } from "@/lib/drinks";
import type { Ranked } from "@/lib/leaderboard";

/**
 * Compact ranking rows (48px, one line each) for the home "This block" card. Rank 1 gets the red
 * accent, your own row a red outline. `limit` cuts the list; your row is still added below when
 * you're outside it.
 */
export function CompactRanking({ rows, limit, meId }: { rows: Ranked[]; limit: number; meId?: number }) {
  let shown = limit ? rows.slice(0, limit) : rows;
  if (limit && meId !== undefined && !shown.some((r) => r.player.id === meId)) {
    const mine = rows.find((r) => r.player.id === meId);
    if (mine) shown = [...shown, mine];
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {shown.map((r, i) => (
        <Row key={r.player.id} r={r} me={r.player.id === meId} gap={i > 0 && r.rank > shown[i - 1].rank + 1} />
      ))}
    </ol>
  );
}

function Row({ r, me, gap }: { r: Ranked; me: boolean; gap: boolean }) {
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
