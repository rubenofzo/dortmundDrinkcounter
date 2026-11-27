import Link from "next/link";
import type { Hub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { loadAt } from "@/lib/metabolism";
import { Chevron, PlayerDot } from "./ui";

/** Everyone: drinkers first by points, then the rest. List rows on phones, cards on desktop. */
export function PeopleList({ hub }: { hub: Hub }) {
  const rows = hub.players
    .map((p) => {
      const mine = hub.drinks.filter((d) => d.playerId === p.id);
      return { p, drinks: mine.length, points: mine.reduce((s, d) => s + d.points, 0), load: loadAt(mine, hub.now) };
    })
    .sort((a, b) => (b.drinks > 0 ? 1 : 0) - (a.drinks > 0 ? 1 : 0) || b.points - a.points || a.p.name.localeCompare(b.p.name));
  return (
    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-hall-panel md:grid md:grid-cols-2 md:gap-4 md:divide-y-0 md:overflow-visible md:border-0 md:bg-transparent lg:grid-cols-3">
      {rows.map(({ p, drinks, points, load }) => (
        <li key={p.id} className="md:overflow-hidden md:rounded-[20px] md:bg-foam md:text-ink md:shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
          <Link href={`/people/${p.slug}`} className="flex min-h-14 items-center gap-3 px-3.5 py-2 text-foam no-underline md:min-h-[96px] md:px-6 md:text-ink">
            <PlayerDot color={p.color} size={12} on="hall" className="md:ring-ink/40" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] leading-tight font-bold md:font-display md:text-[22px] md:font-normal md:uppercase">{p.name}</div>
              <div className="text-[12.5px] text-mist md:text-ink-muted">
                {drinks} {drinks === 1 ? "drink" : "drinks"} · {Math.round(load)} g in the system
              </div>
            </div>
            <span className="tabular font-display text-[22px] leading-none md:text-[26px]">{formatPoints(points)}</span>
            <Chevron className="text-mist md:hidden" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
