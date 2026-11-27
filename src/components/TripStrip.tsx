"use client";

import { useEffect, useState } from "react";
import { tripClock } from "@/lib/time";

/** Header strip: trip name, live trip clock, and group totals. Starts from the server's `now`. */
export function TripStrip({
  now,
  drinks,
  points,
  hourPoints,
}: {
  now: number;
  drinks: number;
  points: string;
  hourPoints: string;
}) {
  const [t, setT] = useState(now);
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => setT(now + (Date.now() - start)), 1000);
    return () => window.clearInterval(id);
  }, [now]);
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-hall-panel">
      <div className="stripe h-1.5" />
      <div className="flex items-baseline justify-between gap-3 px-3.5 pt-3">
        <h1 className="font-display text-[26px] leading-none uppercase md:text-4xl">Sticky Dortmund</h1>
        <span suppressHydrationWarning className="tabular font-display text-[17px] text-accent-light md:text-2xl">{tripClock(t)}</span>
      </div>
      <dl className="grid grid-cols-3 gap-2 px-3.5 pt-3 pb-3.5 text-center">
        {[
          ["Drinks", String(drinks)],
          ["Points", points],
          ["This block", hourPoints],
        ].map(([k, v]) => (
          <div key={k}>
            <dd className="tabular font-display text-[28px] leading-none md:text-4xl">{v}</dd>
            <dt className="mt-1 text-[10px] font-bold tracking-[0.14em] text-mist uppercase">{k}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
