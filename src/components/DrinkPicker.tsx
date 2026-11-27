"use client";

import { useEffect, useRef, useState } from "react";
import { formatAbv, formatVolume, CATEGORIES } from "@/lib/drinks";
import { CUSTOM_ML_CHIPS, MAX_ML, SIZE_ML_CHIPS } from "@/lib/logging";
import { DialogClose } from "./ui";

export type MenuItem = { id: number; name: string; category: string; icon: string; ml: number; abv: number };
export type PickPayload = { drinkTypeId: number; ml?: number } | { custom: { name: string; ml: number; abv: number } };

/**
 * Bottom sheet with the menu for one person. One tap on a drink logs it, in the menu size or,
 * after picking a size at the top (chip or own ml), in that size.
 */
export function DrinkPicker({
  forName,
  menu,
  open,
  busy,
  onPick,
  onClose,
}: {
  forName: string | null;
  menu: MenuItem[];
  open: boolean;
  busy: boolean;
  onPick: (p: PickPayload, honeypot: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [trap, setTrap] = useState("");
  const [name, setName] = useState("");
  const [ml, setMl] = useState<number>(330);
  const [abv, setAbv] = useState("5");
  /** Own size for menu drinks; null = the menu size. */
  const [size, setSize] = useState<number | null>(null);
  const [sizeText, setSizeText] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // Every new pick starts at the menu size.
      setSize(null);
      setSizeText("");
    }
    if (!open && d.open) d.close();
  }, [open]);

  const abvNum = Number(abv.replace(",", "."));
  const customOk = Number.isFinite(abvNum) && abvNum >= 0 && abvNum <= 100 && ml > 0;

  return (
    <dialog
      ref={ref}
      aria-label={`Log a drink for ${forName ?? ""}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none rounded-t-[22px] bg-foam p-0 text-ink shadow-[0_-10px_30px_rgba(0,0,0,0.35)] md:inset-0 md:m-auto md:h-fit md:w-[min(640px,calc(100vw-32px))] md:rounded-[20px]"
    >
      <div className="flex max-h-[92dvh] flex-col overflow-y-auto px-3.5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] md:p-6">
        <div className="flex items-center gap-3">
          <h2 className="min-w-0 flex-1 truncate font-display text-[26px] uppercase">
            Drink for <span className="text-accent-dark">{forName}</span>
          </h2>
          <DialogClose onClick={() => ref.current?.close()} />
        </div>
        {/* Honeypot: hidden from people, bots fill it in. */}
        <input
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          name="website"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <section className="mt-3 rounded-xl bg-foam-line/50 p-2.5">
          <h3 className="mb-1.5 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">Size</h3>
          <div className="no-scrollbar -mx-2.5 flex gap-2 overflow-x-auto px-2.5">
            <SizeChip active={size === null} onClick={() => { setSize(null); setSizeText(""); }}>
              Menu
            </SizeChip>
            {SIZE_ML_CHIPS.map((c) => (
              <SizeChip key={c} active={size === c && sizeText === ""} onClick={() => { setSize(c); setSizeText(""); }}>
                {formatVolume(c)}
              </SizeChip>
            ))}
            <label
              className={`flex min-h-12 flex-none items-center gap-1 rounded-full border px-3.5 ${sizeText ? "border-accent bg-white" : "border-foam-line bg-white/70"}`}
            >
              <input
                inputMode="numeric"
                value={sizeText}
                placeholder="Own"
                aria-label="Own size in ml"
                onChange={(e) => {
                  const text = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                  setSizeText(text);
                  const n = Number(text);
                  setSize(text && n > 0 && n <= MAX_ML ? n : null);
                }}
                className="tabular w-14 bg-transparent text-base font-bold outline-none"
              />
              <span className="text-[13px] text-ink-muted">ml</span>
            </label>
          </div>
        </section>
        {CATEGORIES.map((cat) => {
          const items = menu.filter((m) => m.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} className="mt-4">
              <h3 className="mb-1.5 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">{cat}</h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={busy}
                    onClick={() => onPick(size ? { drinkTypeId: m.id, ml: size } : { drinkTypeId: m.id }, trap)}
                    className="flex min-h-16 items-center gap-2.5 rounded-xl border border-foam-line bg-white/70 px-3 py-2 text-left active:bg-accent active:text-foam disabled:opacity-60"
                  >
                    <span aria-hidden className="text-[26px] leading-none">{m.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-[14px] leading-tight font-bold">{m.name}</span>
                      <span className="tabular block text-[12px] opacity-70">
                        <span className={size ? "font-bold text-accent-dark" : undefined}>{formatVolume(size ?? m.ml)}</span> · {formatAbv(m.abv)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-5 border-t border-foam-line pt-4">
          <h3 className="mb-2 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">🧪 Custom</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="What is it? (optional)"
            className="min-h-14 w-full rounded-xl border border-foam-line bg-white px-3.5 text-base"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {CUSTOM_ML_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setMl(c)}
                aria-pressed={ml === c}
                className={`tabular min-h-12 min-w-16 rounded-full border px-4 font-bold ${ml === c ? "border-accent bg-accent text-foam" : "border-foam-line bg-white/70"}`}
              >
                {c} ml
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="flex min-h-14 flex-1 items-center gap-2 rounded-xl border border-foam-line bg-white px-3.5">
              <input
                inputMode="numeric"
                value={ml || ""}
                onChange={(e) => setMl(Math.min(MAX_ML, Number(e.target.value.replace(/[^0-9]/g, "").slice(0, 4)) || 0))}
                aria-label="Size in ml"
                className="tabular w-full min-w-0 bg-transparent text-base outline-none"
              />
              <span className="text-ink-muted">ml</span>
            </label>
            <label className="flex min-h-14 flex-1 items-center gap-2 rounded-xl border border-foam-line bg-white px-3.5">
              <input
                inputMode="decimal"
                value={abv}
                onChange={(e) => setAbv(e.target.value)}
                aria-label="Alcohol percent"
                className="tabular w-full min-w-0 bg-transparent text-base outline-none"
              />
              <span className="text-ink-muted">%</span>
            </label>
          </div>
          <button
            type="button"
            disabled={busy || !customOk}
            onClick={() => onPick({ custom: { name: name.trim() || "Custom drink", ml, abv: abvNum } }, trap)}
            className="mt-2 min-h-14 w-full rounded-xl bg-accent px-4 font-display text-lg text-foam uppercase disabled:opacity-50"
          >
            Log it
          </button>
        </section>
      </div>
    </dialog>
  );
}

function SizeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tabular min-h-12 flex-none rounded-full border px-4 font-bold whitespace-nowrap ${active ? "border-accent bg-accent text-foam" : "border-foam-line bg-white/70"}`}
    >
      {children}
    </button>
  );
}
