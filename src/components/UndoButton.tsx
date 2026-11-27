"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { undoDrink } from "@/app/actions";

/** Small Undo button used in the Latest feed while the undo window is open. */
export function UndoButton({ drinkId }: { drinkId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await undoDrink(drinkId);
            if (!r.ok) setError(r.error);
            router.refresh();
          })
        }
        className="min-h-11 rounded-xl border border-accent px-3.5 text-sm font-bold text-accent-light active:bg-accent active:text-foam disabled:opacity-50"
      >
        Undo
      </button>
      {error && <span className="text-[11px] text-chip">{error}</span>}
    </span>
  );
}
