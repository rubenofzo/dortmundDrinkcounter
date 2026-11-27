"use client";

import { useState } from "react";
import { DrinkEditor, fieldClass, labelClass } from "@/components/DrinkEditor";
import { PlayerDot } from "@/components/ui";
import { formatAbv, formatVolume } from "@/lib/drinks";
import { formatDayTime } from "@/lib/time";

type Row = { id: number; name: string; icon: string; ml: number; abv: number; at: number; playerId: number };

const PAGE = 50;

/** All logged drinks, newest first, filterable by person. Rows come in already newest first. */
export function AdminDrinks({
  drinks,
  players,
}: {
  drinks: Row[];
  players: { id: number; name: string; color: string }[];
}) {
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState(PAGE);
  const byId = new Map(players.map((p) => [p.id, p]));
  const rows = filter === "all" ? drinks : drinks.filter((d) => d.playerId === Number(filter));

  return (
    <div className="flex flex-col gap-3">
      <label className={labelClass}>
        Show drinks of
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setShown(PAGE);
          }}
          className={fieldClass}
        >
          <option value="all">Everyone ({drinks.length})</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {rows.length === 0 && <p className="text-sm text-ink-muted">No drinks yet.</p>}
      <ul className="flex flex-col divide-y divide-foam-line">
        {rows.slice(0, shown).map((d) => {
          const p = byId.get(d.playerId);
          return (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
              <span aria-hidden className="text-2xl">
                {d.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{d.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <PlayerDot color={p?.color} size={8} />
                  <span className="truncate">
                    {p?.name ?? "?"} · {formatVolume(d.ml)} · {formatAbv(d.abv)} · {formatDayTime(d.at)}
                  </span>
                </p>
              </div>
              <DrinkEditor drink={d} players={players} />
            </li>
          );
        })}
      </ul>
      {rows.length > shown && (
        <button
          type="button"
          onClick={() => setShown(shown + PAGE)}
          className="min-h-12 rounded-full border border-foam-line font-bold hover:bg-foam-line/60"
        >
          Show more ({rows.length - shown} left)
        </button>
      )}
    </div>
  );
}
