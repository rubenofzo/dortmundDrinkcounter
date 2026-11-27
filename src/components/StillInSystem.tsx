import type { Hub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { loadAt } from "@/lib/metabolism";
import { HallPanel, PlayerDot, SectionTitle } from "./ui";

/** Group ranking of who still has alcohol to process (rough estimate, just for fun). */
export function StillInSystem({ hub }: { hub: Hub }) {
  const rows = hub.players
    .map((p) => ({ p, grams: loadAt(hub.drinks.filter((d) => d.playerId === p.id), hub.now) }))
    .filter((r) => r.grams > 0.05)
    .sort((a, b) => b.grams - a.grams);
  return (
    <HallPanel>
      <SectionTitle className="mb-2 uppercase">Still in the system</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-mist">Everyone is clear right now.</p>
      ) : (
        <ol className="flex flex-col">
          {rows.map((r, i) => (
            <li key={r.p.id} className="flex min-h-12 items-center gap-3 border-t border-line first:border-t-0">
              <span className="tabular w-5 text-center text-mist">{i + 1}</span>
              <PlayerDot color={r.p.color} on="hall" size={12} />
              <span className="min-w-0 flex-1 truncate font-bold">{r.p.name}</span>
              <span className="tabular text-right">
                <b className="font-display text-xl">{formatPoints(r.grams / 10)}</b>
                <span className="ml-1 text-xs text-mist">pts · {Math.round(r.grams)} g</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs text-mist">Rough estimate for fun. Not a sobriety or driving check.</p>
    </HallPanel>
  );
}
