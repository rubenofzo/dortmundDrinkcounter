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
  /** Still-in-system figure in points, formatted ("0.0" hides the line). */
  load: string;
};

/** The big tappable people tiles, the drink picker sheet and the log toast. */
export function PeopleGrid({ tiles, menu }: { tiles: TileData[]; menu: MenuItem[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<TileData | null>(null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pending, start] = useTransition();
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

  return (
    <>
      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3.5 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                setTarget(t);
                setOpen(true);
              }}
              className={`flex min-h-[88px] w-full flex-col justify-between gap-1 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.97] active:bg-accent-dark ${
                t.isMe ? "border-accent bg-accent/15" : "border-line bg-hall-panel"
              } hover:border-accent`}
            >
              <span className="flex items-center gap-2">
                <PlayerDot color={t.color} size={12} on="hall" />
                <span className="min-w-0 flex-1 truncate text-[17px] font-extrabold">{t.name}</span>
                {t.isMe && <span className="text-[10px] font-bold tracking-widest text-accent-light uppercase">you</span>}
              </span>
              <span className="flex items-end justify-between gap-2">
                <span className="tabular font-display text-[28px] leading-none">
                  {t.todayPoints}
                  <span className="ml-1 text-[12px] font-sans font-semibold text-mist">pts · {t.todayCount} 🍺</span>
                </span>
              </span>
              {t.load !== "0.0" && <span className="tabular text-[12px] text-mist">still in system {t.load} pts</span>}
            </button>
          </li>
        ))}
      </ul>
      <DrinkPicker forName={target?.name ?? null} menu={menu} open={open} busy={pending} onPick={pick} onClose={() => setOpen(false)} />
      <LogToast toast={toast} onUndo={undo} onDismiss={dismiss} />
    </>
  );
}
