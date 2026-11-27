"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { logDrink, undoDrink } from "@/app/actions";
import { DrinkPicker, type MenuItem, type PickPayload } from "./DrinkPicker";
import { LogToast, type ToastState } from "./LogToast";
import { PlayerDot } from "./ui";

export type TileData = {
  id: number;
  name: string;
  color: string;
  isMe: boolean;
  todayPoints: string;
  todayCount: number;
};

/** "Drink for me" button, a compact name grid (with search for big groups), the drink picker sheet and the log toast. */
export function PeopleGrid({ tiles, menu }: { tiles: TileData[]; menu: MenuItem[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<TileData | null>(null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const dismiss = useCallback(() => setToast(null), []);

  function pick(p: PickPayload, honeypot: string) {
    if (!target) return;
    const who = target;
    start(async () => {
      const res = await logDrink({ playerId: who.id, website: honeypot, ...p });
      setOpen(false);
      if (res.ok) setToast({ kind: "ok", label: `${res.label} for ${res.playerName}`, drinkId: res.drinkId });
      else setToast({ kind: "error", label: res.error });
      router.refresh();
    });
  }

  async function undo(drinkId: number) {
    const res = await undoDrink(drinkId);
    setToast(res.ok ? { kind: "error", label: "Undone" } : { kind: "error", label: res.error });
    router.refresh();
  }

  const me = tiles.find((t) => t.isMe);
  const others = tiles.filter((t) => !t.isMe).sort((a, b) => a.name.localeCompare(b.name));
  const q = query.trim().toLowerCase();
  const shown = q ? others.filter((t) => t.name.toLowerCase().includes(q)) : others;
  const choose = (t: TileData) => {
    setTarget(t);
    setOpen(true);
  };

  return (
    <>
      <section className="flex flex-col gap-2.5">
        {me && (
          <button
            type="button"
            onClick={() => choose(me)}
            className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-accent px-4 text-left text-foam shadow-[0_8px_20px_rgba(229,58,47,0.25)] transition active:scale-[0.98] active:bg-accent-dark"
          >
            <PlayerDot color={me.color} size={12} on="hall" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-extrabold">Drink for me</span>
              <span className="tabular block text-[12.5px] text-foam/85">
                {me.name} · {me.todayPoints} pts today · {me.todayCount} 🍺
              </span>
            </span>
            <span aria-hidden className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-foam text-[24px] leading-none font-bold text-accent">
              +
            </span>
          </button>
        )}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-bold tracking-[0.14em] text-mist uppercase">{me ? "Or for someone else" : "Tap a name to log a drink"}</h2>
          {others.length > 9 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find…"
              aria-label="Find a person"
              className="h-9 w-32 rounded-full border border-line bg-hall-panel px-3.5 text-[14px] text-foam placeholder:text-mist/70 focus:border-accent focus:outline-none"
            />
          )}
        </div>
        <ul className="grid grid-cols-3 gap-1.5 md:grid-cols-5 md:gap-3 lg:grid-cols-6">
          {shown.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => choose(t)}
                className="flex min-h-[52px] w-full flex-col justify-center gap-0.5 rounded-xl border border-line bg-hall-panel px-2.5 py-1.5 text-left transition hover:border-accent active:scale-[0.97] active:bg-accent-dark"
              >
                <span className="flex items-center gap-1.5">
                  <PlayerDot color={t.color} size={8} on="hall" />
                  <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold">{t.name}</span>
                </span>
                <span className="tabular text-[11.5px] text-mist">
                  {t.todayPoints} pts · {t.todayCount} 🍺
                </span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="col-span-full py-3 text-center text-sm text-mist">Nobody called “{query}”.</li>}
        </ul>
      </section>
      <DrinkPicker forName={target?.name ?? null} menu={menu} open={open} busy={pending} onPick={pick} onClose={() => setOpen(false)} />
      <LogToast toast={toast} onUndo={undo} onDismiss={dismiss} />
    </>
  );
}
