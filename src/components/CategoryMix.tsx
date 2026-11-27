"use client";

import { CATEGORY_ICON, type Category } from "@/lib/drinks";

type Slice = { category: string; count: number };

/** Category colours: red family plus gold and hop, no new tokens. */
const COLORS: Record<string, string> = { Beer: "#f5b301", Wine: "#a5170f", Mixed: "#ff6a5c", Shots: "#8fdc8a", Custom: "#c2b294" };

/** Small stacked bar of a person's drink mix, with a legend. */
export function CategoryMixBar({ mix }: { mix: Slice[] }) {
  const total = mix.reduce((s, m) => s + m.count, 0);
  if (total === 0) return <p className="text-sm text-ink-muted">No drinks yet.</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-foam-line">
        {mix.map((m) => (
          <span key={m.category} style={{ width: `${(m.count / total) * 100}%`, background: COLORS[m.category] ?? COLORS.Custom }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-muted">
        {mix.map((m) => (
          <li key={m.category}>
            {CATEGORY_ICON[m.category as Category] ?? "🍺"} {m.category} <b className="text-ink">{m.count}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
