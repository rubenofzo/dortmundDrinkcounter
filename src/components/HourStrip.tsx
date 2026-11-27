"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type StripChip = { key: string; href: string; label: string; sub?: string; crown?: boolean; live?: boolean };

/** Horizontally scrolling chips (3-hour blocks or days); the selected one is centred on load/change. Links, not state. */
export function HourStrip({ chips, selected }: { chips: StripChip[]; selected: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selected]);
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
      {chips.map((c) => {
        const on = c.key === selected;
        return (
          <Link
            key={c.key}
            ref={on ? ref : undefined}
            href={c.href}
            scroll={false}
            aria-current={on ? "true" : undefined}
            className={clsx(
              "flex min-h-14 flex-none flex-col items-center justify-center rounded-xl border px-4 text-center",
              on ? "border-accent bg-accent text-foam" : "border-line bg-hall-panel text-foam hover:bg-hall-light",
            )}
          >
            <span className="font-display text-[17px] leading-tight whitespace-nowrap uppercase">
              {c.label}
              {c.crown && <span className="ml-1 text-gold">👑</span>}
            </span>
            {(c.sub || c.live) && (
              <span className={clsx("text-[11px] font-semibold", on ? "text-foam/80" : "text-mist")}>
                {c.live ? "now" : c.sub}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
