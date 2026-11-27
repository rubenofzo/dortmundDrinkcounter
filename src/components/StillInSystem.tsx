import type { Hub, Player } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { loadAt } from "@/lib/metabolism";
import { ShowMore } from "./ShowMore";
import { HallPanel, PlayerDot, SectionTitle } from "./ui";

const SHOWN = 5;

/** Group ranking of who still has alcohol to process (rough estimate, just for fun). Top 5, the rest folded. */
export function StillInSystem({ hub }: { hub: Hub }) {
  const rows = hub.players
    .map((p) => ({ p, grams: loadAt(hub.drinks.filter((d) => d.playerId === p.id), hub.now) }))
    .filter((r) => r.grams > 0.05)
    .sort((a, b) => b.grams - a.grams);
  const fold = rows.length > SHOWN + 2;
  const head = fold ? rows.slice(0, SHOWN) : rows;
  return (
    <HallPanel>
      <SectionTitle className="mb-2 uppercase">Still in the system</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-mist">Everyone is clear right now.</p>
      ) : (
        <>
          <List rows={head} from={0} />
          {fold && (
            <ShowMore label={`Show all ${rows.length}`}>
              <List rows={rows.slice(SHOWN)} from={SHOWN} />
            </ShowMore>
          )}
        </>
      )}
      <p className="mt-2 text-xs text-mist">Rough estimate for fun. Not a sobriety or driving check.</p>
    </HallPanel>
  );
}

function List({ rows, from }: { rows: { p: Player; grams: number }[]; from: number }) {
  return (
    <ol start={from + 1} className={`flex flex-col ${from > 0 ? "border-t border-line" : ""}`}>
      {rows.map((r, i) => (
        <li key={r.p.id} className="flex min-h-11 items-center gap-3 border-t border-line first:border-t-0">
          <span className="tabular w-5 text-center text-mist">{from + i + 1}</span>
          <PlayerDot color={r.p.color} on="hall" size={10} />
          <span className="min-w-0 flex-1 truncate font-bold">{r.p.name}</span>
          <span className="tabular text-right">
            <b className="font-display text-xl">{formatPoints(r.grams / 10)}</b>
            <span className="ml-1 text-xs text-mist">pts · {Math.round(r.grams)} g</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
