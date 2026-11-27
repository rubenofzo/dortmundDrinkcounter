import type { Hub } from "@/lib/data";
import { UNDO_WINDOW_MS } from "@/lib/data";
import { formatAbv, formatPoints, formatVolume } from "@/lib/drinks";
import { formatClock } from "@/lib/time";
import { ShowMore } from "./ShowMore";
import { HallPanel, SectionTitle } from "./ui";
import { UndoButton } from "./UndoButton";

/** The last 10 drinks, newest first (5 shown, 5 folded), with Undo while the window is open. */
export function LatestFeed({ hub }: { hub: Hub }) {
  const latest = [...hub.drinks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  const row = (d: Hub["drinks"][number]) => {
    const who = hub.playerById.get(d.playerId);
    const by = d.loggedByPlayerId && d.loggedByPlayerId !== d.playerId ? hub.playerById.get(d.loggedByPlayerId) : null;
    return (
      <li key={d.id} className="flex min-h-12 items-center gap-3 border-t border-line first:border-t-0">
        <span aria-hidden className="w-7 flex-none text-center text-[22px]">{d.icon}</span>
        <span className="min-w-0 flex-1 py-1.5">
          <span className="block truncate text-[15px]">
            <b>{who?.name ?? "?"}</b> <span className="text-mist">·</span> {d.name}
          </span>
          <span className="block truncate text-[12px] text-mist">
            {formatClock(d.createdAt)} · {formatPoints(d.points)} pts · {formatVolume(d.ml)} · {formatAbv(d.abv)}
            {by && ` · by ${by.name}`}
          </span>
        </span>
        {hub.now - d.createdAt < UNDO_WINDOW_MS && <UndoButton drinkId={d.id} />}
      </li>
    );
  };
  return (
    <HallPanel>
      <SectionTitle className="mb-1 uppercase">Latest</SectionTitle>
      {latest.length === 0 ? (
        <p className="text-mist">Nothing logged yet. Tap a name to start.</p>
      ) : (
        <>
          <ul className="flex flex-col">{latest.slice(0, 5).map(row)}</ul>
          {latest.length > 5 && (
            <ShowMore label="Show 5 more">
              <ul className="flex flex-col border-t border-line">{latest.slice(5).map(row)}</ul>
            </ShowMore>
          )}
        </>
      )}
    </HallPanel>
  );
}
