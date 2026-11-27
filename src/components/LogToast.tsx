"use client";

import { useEffect, useState } from "react";
import { UNDO_MS } from "@/lib/logging";

export type ToastState = { kind: "ok"; label: string; drinkId: number } | { kind: "error"; label: string };

/** Fixed toast above the bottom nav: logged drink with Undo, or an error such as the rate limit. */
export function LogToast({
  toast,
  onUndo,
  onDismiss,
}: {
  toast: ToastState | null;
  onUndo: (drinkId: number) => Promise<void>;
  onDismiss: () => void;
}) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!toast) return;
    // Errors vanish quickly; the undo toast stays for the whole undo window.
    const id = window.setTimeout(onDismiss, toast.kind === "ok" ? UNDO_MS : 5000);
    return () => window.clearTimeout(id);
  }, [toast, onDismiss]);
  if (!toast) return null;
  const ok = toast.kind === "ok";
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-hall-deep px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] md:bottom-6"
    >
      <p className={`min-w-0 flex-1 text-[15px] font-bold ${ok ? "" : "text-chip"}`}>{toast.label}</p>
      {ok && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onUndo(toast.drinkId);
            setBusy(false);
          }}
          className="min-h-11 rounded-xl bg-accent px-4 font-display text-base text-foam uppercase disabled:opacity-60"
        >
          Undo
        </button>
      )}
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="flex h-11 w-9 items-center justify-center text-mist">
        ✕
      </button>
    </div>
  );
}
