import type { Drink, Player } from "@/lib/data";
import { formatAbv, formatPoints, formatVolume } from "@/lib/drinks";
import { isAdmin } from "@/lib/auth";
import { formatDayTime } from "@/lib/time";
import { DrinkEditor } from "./DrinkEditor";
import { CardPanel } from "./ui";

/** Full drink log of one person, newest first. The admin gets edit/delete controls per row. */
export async function DrinkLog({ drinks, players }: { drinks: Drink[]; players: Player[] }) {
  const admin = await isAdmin();
  const rows = [...drinks].sort((a, b) => b.at - a.at || b.id - a.id);
  if (rows.length === 0) return <CardPanel className="text-center text-ink-muted">No drinks logged yet.</CardPanel>;
  const list = players.map((p) => ({ id: p.id, name: p.name }));
  return (
    <CardPanel list className="divide-y divide-foam-line py-1">
      {rows.map((d) => (
        <div key={d.id} className="flex flex-col gap-1 py-2.5 md:px-0">
          <div className="flex items-center gap-3">
            <span aria-hidden className="w-8 flex-none text-center text-[24px]">{d.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-semibold">{d.name}</div>
              <div className="text-[13px] text-ink-muted">
                {formatVolume(d.ml)} · {formatAbv(d.abv)} · {formatDayTime(d.at)}
              </div>
            </div>
            <span className="font-display text-[22px] leading-none">{formatPoints(d.points)}</span>
          </div>
          {admin && (
            <div className="pl-11">
              <DrinkEditor drink={{ id: d.id, name: d.name, ml: d.ml, abv: d.abv, at: d.at, playerId: d.playerId }} players={list} />
            </div>
          )}
        </div>
      ))}
    </CardPanel>
  );
}
