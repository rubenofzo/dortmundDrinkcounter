import Link from "next/link";
import { HallPanel, PlayerDot, SectionTitle } from "@/components/ui";
import type { Player } from "@/lib/data";

/** 3-hour blocks won per person (a tie counts for each winner). */
export function HallOfHours({ winners, playerById }: { winners: Map<number, number[]>; playerById: Map<number, Player> }) {
  const counts = new Map<number, number>();
  for (const ids of winners.values()) for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const rows = [...counts]
    .map(([id, n]) => ({ player: playerById.get(id), n }))
    .filter((r): r is { player: Player; n: number } => !!r.player)
    .sort((a, b) => b.n - a.n || a.player.name.localeCompare(b.player.name));
  return (
    <HallPanel>
      <SectionTitle className="mb-3 uppercase">
        <span className="text-gold">👑</span> Hall of Champions
      </SectionTitle>
      {rows.length === 0 ? (
        <p className="text-mist">No block has been won yet. The first full 3-hour block crowns a champion.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map(({ player, n }) => (
            <li key={player.id}>
              <Link href={`/people/${player.slug}`} className="flex min-h-14 items-center gap-3">
                <PlayerDot color={player.color} size={12} on="hall" />
                <span className="flex-1 truncate text-[17px] font-bold">{player.name}</span>
                <span className="font-display text-[26px] leading-none">{n}</span>
                <span className="w-10 text-[11px] font-semibold text-mist uppercase">{n === 1 ? "block" : "blocks"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HallPanel>
  );
}
