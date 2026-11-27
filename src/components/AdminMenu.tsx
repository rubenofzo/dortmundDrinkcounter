"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDrinkType, setDrinkTypeHidden, updateDrinkType, type Result } from "@/app/admin/actions";
import { fieldClass, labelClass } from "@/components/DrinkEditor";
import { CATEGORIES, CATEGORY_ICON, formatAbv, formatVolume } from "@/lib/drinks";

type Item = { id: number; name: string; category: string; icon: string; ml: number; abv: number; sortOrder: number; hidden: boolean };

/** Add, edit and hide/unhide menu items. Never changes drinks already logged. */
export function AdminMenu({ items }: { items: Item[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<number | "new" | null>(null);

  function run(fn: () => Promise<Result>, after?: () => void) {
    start(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error);
      setError(null);
      after?.();
      router.refresh();
    });
  }

  function form(item: Item | null) {
    const read = (fd: FormData) => ({
      name: String(fd.get("name") ?? ""),
      category: String(fd.get("category") ?? "") as (typeof CATEGORIES)[number] | "Custom",
      icon: String(fd.get("icon") ?? ""),
      ml: Number(fd.get("ml")),
      abv: Number(fd.get("abv")),
      sortOrder: Number(fd.get("sortOrder") || 0),
    });
    return (
      <form
        key={item?.id ?? "new"}
        className="flex flex-col gap-3 rounded-xl bg-foam-line/40 p-3"
        action={(fd) =>
          run(
            () => (item ? updateDrinkType({ ...read(fd), drinkTypeId: item.id }) : addDrinkType(read(fd))),
            () => setEditing(null),
          )
        }
      >
        <label className={labelClass}>
          Name
          <input name="name" defaultValue={item?.name} required maxLength={60} className={fieldClass} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Category
            <select name="category" defaultValue={item?.category ?? CATEGORIES[0]} className={fieldClass}>
              {[...CATEGORIES, "Custom" as const].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Icon
            <input name="icon" defaultValue={item?.icon ?? "🍺"} required maxLength={8} className={fieldClass} />
          </label>
          <label className={labelClass}>
            ml
            <input name="ml" type="number" inputMode="numeric" min={1} defaultValue={item?.ml} required className={fieldClass} />
          </label>
          <label className={labelClass}>
            ABV %
            <input name="abv" type="number" inputMode="decimal" step="0.1" min={0} defaultValue={item?.abv} required className={fieldClass} />
          </label>
          <label className={labelClass}>
            Sort order
            <input name="sortOrder" type="number" inputMode="numeric" defaultValue={item?.sortOrder ?? (items.length + 1) * 10} className={fieldClass} />
          </label>
        </div>
        <div className="flex gap-2">
          <button disabled={pending} className="min-h-12 flex-1 rounded-full bg-accent px-5 font-bold text-white hover:bg-accent-light disabled:opacity-50">
            {pending ? "Saving…" : item ? "Save" : "Add to menu"}
          </button>
          <button type="button" onClick={() => setEditing(null)} className="min-h-12 rounded-full border border-foam-line px-5 font-bold">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm font-semibold text-chip-dark">{error}</p>}
      <ul className="flex flex-col divide-y divide-foam-line">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col gap-2 py-3">
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">
                {it.icon || CATEGORY_ICON[it.category as keyof typeof CATEGORY_ICON]}
              </span>
              <div className={`min-w-0 flex-1 ${it.hidden ? "opacity-50" : ""}`}>
                <p className="truncate font-bold">{it.name}</p>
                <p className="text-xs text-ink-muted">
                  {it.category} · {formatVolume(it.ml)} · {formatAbv(it.abv)}
                  {it.hidden && " · hidden"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(editing === it.id ? null : it.id)}
                className="min-h-11 rounded-full border border-foam-line px-4 text-sm font-bold hover:bg-foam-line/60"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setDrinkTypeHidden({ drinkTypeId: it.id, hidden: !it.hidden }))}
                className="min-h-11 rounded-full px-3 text-sm font-bold text-accent-dark hover:bg-accent/10 disabled:opacity-50"
              >
                {it.hidden ? "Show" : "Hide"}
              </button>
            </div>
            {editing === it.id && form(it)}
          </li>
        ))}
      </ul>
      {editing === "new" ? (
        form(null)
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="min-h-14 rounded-full bg-accent px-6 font-bold text-white hover:bg-accent-light"
        >
          Add a drink to the menu
        </button>
      )}
    </div>
  );
}
