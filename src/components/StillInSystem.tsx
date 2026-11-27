import type { Hub } from "@/lib/data";
import { loadAt, loadCurve } from "@/lib/metabolism";
import { LoadChart } from "./AlcoholLoad";
import { HallPanel, SectionTitle } from "./ui";

const SHOWN = 5;
/** People offered as chips under the chart (the top SHOWN start switched on). */
const CHIPS = 15;
const WINDOW_MS = 12 * 60 * 60_000;

/** Who still has alcohol to process (rough estimate, just for fun): a curve chart of the top 5 with name chips to add or hide people. */
export function StillInSystem({ hub }: { hub: Hub }) {
  const rows = hub.players
    .map((p) => {
      const mine = hub.drinks.filter((d) => d.playerId === p.id);
      return { p, mine, grams: loadAt(mine, hub.now) };
    })
    .filter((r) => r.grams > 0.05)
    .sort((a, b) => b.grams - a.grams);
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
          <p className="mt-1 text-[11px] text-mist">Last 12 hours. Tap names to add or hide lines.</p>
        </>
      )}
      <p className="mt-2 text-xs text-mist">Rough estimate for fun. Not a sobriety or driving check.</p>
    </HallPanel>
  );
}
