"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/time";

/** Live "m:ss" until `endMs`, seeded from the server's `now` so a wrong phone clock doesn't matter. */
export function HourCountdown({ endMs, seedNow, className }: { endMs: number; seedNow: number; className?: string }) {
  const [tick, setTick] = useState({ seed: seedNow, ms: 0 });
  const elapsed = tick.seed === seedNow ? tick.ms : 0;
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => setTick({ seed: seedNow, ms: performance.now() - t0 }), 1000);
    return () => window.clearInterval(id);
  }, [seedNow]);
  return (
    <span className={className} suppressHydrationWarning>
      {formatCountdown(endMs - seedNow - elapsed)}
    </span>
  );
}
