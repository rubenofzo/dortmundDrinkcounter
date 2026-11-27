import type { Hub, Player } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { loadAt, loadCurve } from "@/lib/metabolism";
import { LoadChart } from "./AlcoholLoad";
import { ShowMore } from "./ShowMore";
import { HallPanel, PlayerDot, SectionTitle } from "./ui";

const SHOWN = 5;
/** People offered as chips under the chart (the top SHOWN start switched on). */
const CHIPS = 15;
const WINDOW_MS = 12 * 60 * 60_000;

/** Who still has alcohol to process (rough estimate, just for fun): a curve chart of the top 5, then the ranking (top 5, the rest folded). */
export function StillInSystem({ hub }: { hub: Hub }) {
  const rows = hub.players
    .map((p) => {
      const mine = hub.drinks.filter((d) => d.playerId === p.id);
      return { p, mine, grams: loadAt(mine, hub.now) };
    })
    .filter((r) => r.grams > 0.05)
    .sort((a, b) => b.grams - a.grams);
  const fold = rows.length > SHOWN + 2;
  const head = fold ? rows.slice(0, SHOWN) : rows;
  const top = rows.slice(0, CHIPS);
  // Start at the first of their drinks in the window (minus 15 minutes), so the chart isn't mostly flat.
  const firstAt = Math.min(...top.flatMap((r) => r.mine.map((d) => d.at)).filter((at) => at >= hub.now - WINDOW_MS));
  const from = Number.isFinite(firstAt) ? Math.max(hub.now - WINDOW_MS, firstAt - 15 * 60_000) : hub.now - WINDOW_MS;
  const series = top.map((r) => ({
    key: `p${r.p.id}`,
    name: r.p.name,
    color: r.p.color,
    curve: loadCurve(r.mine, from, hub.now),
  }));
  return (
    <HallPanel>
      <SectionTitle className="mb-2 uppercase">Still in the system</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-mist">Everyone is clear right now.</p>
      ) : (
        <>
          <LoadChart series={series} shown={SHOWN} />
          <p className="mt-1 mb-2 text-[11px] text-mist">Last 12 hours. Tap names to add or hide lines.</p>
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
