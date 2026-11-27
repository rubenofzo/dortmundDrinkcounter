"use client";

import { useEffect, useRef, useState } from "react";
import type { UnlockToastItem } from "@/lib/achievementViews";

const STORAGE_KEY = "drinkhub:seen-unlocks";
const CONFETTI = ["#e53a2f", "#f5b301", "#fbf5e6", "#8fdc8a", "#ff6a5c"];

function readSeen(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function writeSeen(keys: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys.slice(-200)));
  } catch {
    // Storage can be blocked; the in-memory set still works for this visit.
  }
}

/**
 * Shows a confetti toast when an unlock appears that this phone hasn't seen. The first render is
 * the baseline (plus whatever localStorage remembers), so old unlocks never pop up on a fresh
 * load; the page refreshes every 15 s, so new ones show up as the props change.
 */
export function UnlockToast({ items }: { items: UnlockToastItem[] }) {
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<UnlockToastItem[]>([]);
  const current = queue[0];

  useEffect(() => {
    if (seen.current === null) {
      // Baseline: everything on screen now counts as seen.
      seen.current = new Set([...(readSeen() ?? []), ...items.map((i) => i.key)]);
      writeSeen([...seen.current]);
      return;
    }
    const fresh = items.filter((i) => !seen.current!.has(i.key));
    if (fresh.length === 0) return;
    for (const f of fresh) seen.current.add(f.key);
    writeSeen([...seen.current]);
    // Oldest first, so the list reads in the order things happened (`items` is newest first).
    setQueue((q) => [...q, ...fresh.reverse()]);
  }, [items]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 4500);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;
  return (
    <div
      key={current.key}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-50 flex justify-center px-4"
    >
      <style>{`
        @keyframes uk-pop { from { transform: translateY(-24px) scale(.92); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes uk-fall { from { transform: translate(0,0) rotate(0); opacity: 1 } to { transform: translate(var(--dx), 160px) rotate(var(--rot)); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .uk-anim, .uk-bit { animation: none !important } .uk-bit { display: none } }
      `}</style>
      <div
        className="uk-anim pointer-events-auto relative flex min-h-14 max-w-[min(440px,100%)] items-center gap-2 rounded-2xl border border-gold bg-hall px-4 py-3 font-bold text-foam shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
        style={{ animation: "uk-pop 0.35s ease-out" }}
        onClick={() => setQueue((q) => q.slice(1))}
      >
        <span>{current.text}</span>
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="uk-bit absolute top-1/2 left-1/2 h-2 w-1.5 rounded-[1px]"
            style={
              {
                backgroundColor: CONFETTI[i % CONFETTI.length],
                "--dx": `${(i - 9) * 18}px`,
                "--rot": `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
                animation: `uk-fall ${1.1 + (i % 5) * 0.15}s ease-out ${(i % 4) * 0.05}s forwards`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
