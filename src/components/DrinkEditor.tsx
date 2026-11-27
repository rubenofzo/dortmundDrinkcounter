"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDrink, updateDrink } from "@/app/admin/actions";
import { fromBerlinInput, toBerlinInput } from "@/lib/berlinInput";

type EditableDrink = { id: number; name: string; ml: number; abv: number; at: number; playerId: number };

export const fieldClass =
  "min-h-12 w-full rounded-lg border border-foam-line bg-white px-3 text-base text-ink focus:border-accent-dark focus:outline-none";
export const labelClass = "flex flex-col gap-1.5 text-sm font-bold text-ink-muted";

/** Admin-only "Edit" button that opens a small inline form to fix or delete one logged drink. */
export function DrinkEditor({ drink, players }: { drink: EditableDrink; players: { id: number; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(formData: FormData) {
    const at = fromBerlinInput(String(formData.get("at") ?? ""));
    if (at === null) return setError("Pick a valid time.");
    start(async () => {
      const res = await updateDrink({
        drinkId: drink.id,
        playerId: Number(formData.get("playerId")),
        name: String(formData.get("name") ?? ""),
        ml: Number(formData.get("ml")),
        abv: Number(formData.get("abv")),
        at,
      });
      if (!res.ok) return setError(res.error);
      setError(null);
      setOpen(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Delete ${drink.name}?`)) return;
    start(async () => {
      const res = await deleteDrink({ drinkId: drink.id });
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-full border border-foam-line px-4 text-sm font-bold text-ink hover:bg-foam-line/60"
      >
        Edit
      </button>
    );
  }

  return (
    <form action={save} className="flex w-full flex-col gap-3 rounded-xl bg-foam-line/40 p-3 text-ink">
      <label className={labelClass}>
        Person
        <select name="playerId" defaultValue={drink.playerId} className={fieldClass}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Drink
        <input name="name" defaultValue={drink.name} required maxLength={60} className={fieldClass} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          ml
          <input name="ml" type="number" inputMode="numeric" min={1} defaultValue={drink.ml} required className={fieldClass} />
        </label>
        <label className={labelClass}>
          ABV %
          <input name="abv" type="number" inputMode="decimal" step="0.1" min={0} defaultValue={drink.abv} required className={fieldClass} />
        </label>
      </div>
      <label className={labelClass}>
        Time (Berlin)
        <input name="at" type="datetime-local" defaultValue={toBerlinInput(drink.at)} required className={fieldClass} />
      </label>
      {error && <p className="text-sm font-semibold text-chip-dark">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="min-h-12 flex-1 rounded-full bg-accent px-5 font-bold text-white hover:bg-accent-light disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-12 rounded-full border border-foam-line px-5 font-bold">
          Cancel
        </button>
        <button type="button" onClick={remove} disabled={pending} className="min-h-12 rounded-full px-5 font-bold text-chip-dark hover:bg-chip/10 disabled:opacity-50">
          Delete
        </button>
      </div>
    </form>
  );
}
