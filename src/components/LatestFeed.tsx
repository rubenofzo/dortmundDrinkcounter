import type { Hub } from "@/lib/data";
import { UNDO_WINDOW_MS } from "@/lib/data";
import { formatAbv, formatPoints, formatVolume } from "@/lib/drinks";
import { formatDayTime } from "@/lib/time";
import { HallPanel, SectionTitle } from "./ui";
import { UndoButton } from "./UndoButton";

/** The last 10 drinks, newest first, with Undo while the window is open. */
export function LatestFeed({ hub }: { hub: Hub }) {
  const latest = [...hub.drinks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  return (
    <HallPanel>
      <SectionTitle className="mb-2 uppercase">Latest</SectionTitle>
      {latest.length === 0 ? (
        <p className="text-mist">Nothing logged yet. Tap a name to start.</p>
      ) : (
        <ul className="flex flex-col">
          {latest.map((d) => {
            const who = hub.playerById.get(d.playerId);
            const by = d.loggedByPlayerId && d.loggedByPlayerId !== d.playerId ? hub.playerById.get(d.loggedByPlayerId) : null;
            return (
              <li key={d.id} className="flex min-h-14 items-center gap-3 border-t border-line first:border-t-0">
                <span aria-hidden className="text-[26px]">{d.icon}</span>
                <span className="min-w-0 flex-1 py-2">
                  <span className="block truncate text-[15px] font-bold">
                    {d.name} <span className="font-normal text-mist">{formatVolume(d.ml)} · {formatAbv(d.abv)}</span>
                  </span>
                  <span className="block truncate text-[12.5px] text-mist">
                    {who?.name ?? "?"} · {formatPoints(d.points)} pts · {formatDayTime(d.createdAt)}
                    {by && ` · logged by ${by.name}`}
                  </span>
                </span>
                {hub.now - d.createdAt < UNDO_WINDOW_MS && <UndoButton drinkId={d.id} />}
              </li>
            );
          })}
        </ul>
      )}
    </HallPanel>
  );
}
