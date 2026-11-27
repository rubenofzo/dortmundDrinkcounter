"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mergePlayers, removePlayer, renamePlayer, type Result } from "@/app/admin/actions";
import { fieldClass, labelClass } from "@/components/DrinkEditor";
import { PlayerDot } from "@/components/ui";

type P = { id: number; name: string; color: string; drinkCount: number };

/** Rename, merge and remove players. */
export function AdminPlayers({ players }: { players: P[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<number | null>(null);

  function run(fn: () => Promise<Result>, after?: () => void) {
    start(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error);
      setError(null);
      after?.();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm font-semibold text-chip-dark">{error}</p>}
      <ul className="flex flex-col divide-y divide-foam-line">
        {players.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 py-3">
            <div className="flex items-center gap-3">
              <PlayerDot color={p.color} size={14} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{p.name}</p>
                <p className="text-xs text-ink-muted">{p.drinkCount} drinks</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(editing === p.id ? null : p.id)}
                className="min-h-11 rounded-full border border-foam-line px-4 text-sm font-bold hover:bg-foam-line/60"
              >
                {editing === p.id ? "Close" : "Manage"}
              </button>
            </div>
            {editing === p.id && (
              <div className="flex flex-col gap-4 rounded-xl bg-foam-line/40 p-3">
                <form
                  className="flex flex-col gap-2"
                  action={(fd) => run(() => renamePlayer({ playerId: p.id, name: String(fd.get("name") ?? "") }))}
                >
                  <label className={labelClass}>
                    Rename
                    <input name="name" defaultValue={p.name} required maxLength={60} className={fieldClass} />
                  </label>
                  <button disabled={pending} className="min-h-12 rounded-full bg-accent px-5 font-bold text-white hover:bg-accent-light disabled:opacity-50">
                    Save name
                  </button>
                </form>
                <form
                  className="flex flex-col gap-2"
                  action={(fd) => {
                    const intoId = Number(fd.get("intoId"));
                    const into = players.find((x) => x.id === intoId);
                    if (!into) return setError("Pick who to merge into.");
                    if (!window.confirm(`Merge ${p.name} into ${into.name}? ${p.name} will be deleted and their drinks move to ${into.name}.`)) return;
                    run(() => mergePlayers({ fromId: p.id, intoId }), () => setEditing(null));
                  }}
                >
                  <label className={labelClass}>
                    Merge {p.name} into…
                    <select name="intoId" defaultValue="" className={fieldClass}>
                      <option value="" disabled>
                        Choose a person
                      </option>
                      {players
                        .filter((x) => x.id !== p.id)
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button disabled={pending} className="min-h-12 rounded-full border border-foam-line px-5 font-bold hover:bg-foam-line disabled:opacity-50">
                    Merge
                  </button>
                </form>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`Remove ${p.name} and their ${p.drinkCount} drinks? This can't be undone.`)) return;
                    run(() => removePlayer({ playerId: p.id }), () => setEditing(null));
                  }}
                  className="min-h-12 rounded-full px-5 font-bold text-chip-dark hover:bg-chip/10 disabled:opacity-50"
                >
                  Remove player
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
