"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPoint, ChartSeries } from "@/lib/hours";

/**
 * The race: total points per person over the weekend, one line each, like PokerHub's balance chart.
 * Takes the per-block data from `blockChartData` (`src/lib/hours.ts`) and adds it up, starting at 0.
 * Tap a name below the chart to show or hide that line.
 */
export function HourChart({ points, series, height = 240 }: { points: ChartPoint[]; series: ChartSeries[]; height?: number }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);

  const running = useMemo(() => {
    const totals: Record<string, number> = Object.fromEntries(series.map((s) => [s.key, 0]));
    const out: ChartPoint[] = [{ label: "Start", ...totals }];
    for (const p of points) {
      const row: ChartPoint = { label: p.label };
      for (const s of series) {
        totals[s.key] += Number(p[s.key] ?? 0);
        row[s.key] = Math.round(totals[s.key] * 10) / 10;
      }
      out.push(row);
    }
    return out;
  }, [points, series]);

  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-mist">No drinks yet. The chart starts with the first one.</p>;
  }

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const visible = series.filter((s) => !hidden.has(s.key));
  // Dots help with a few points, but clutter a full weekend.
  const dots = running.length <= 12;

  return (
    <div className="flex flex-col gap-2.5">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={running} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="#4a3b22" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#c2b294", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#4a3b22" }} minTickGap={16} />
            <YAxis tick={{ fill: "#c2b294", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#fbf5e6", border: "none", borderRadius: 10, color: "#17120a", fontSize: 13 }}
              labelStyle={{ fontWeight: 700 }}
              itemStyle={{ padding: 0 }}
              itemSorter={(item) => -Number(item.value)}
              formatter={(v, name) => [typeof v === "number" ? v.toFixed(1) : v, name]}
            />
            {visible.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={focus === s.key ? 4 : 2.5}
                strokeOpacity={focus && focus !== s.key ? 0.25 : 1}
                dot={dots ? { r: 2.5, fill: s.color, strokeWidth: 0 } : false}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {series.length > 1 && (
        <div>
          {/* One swipeable row of names on phones, wrapping on desktop. */}
          <div
            className="no-scrollbar -mx-3.5 -my-1.5 flex flex-nowrap gap-1.5 overflow-x-auto px-3.5 py-1.5 md:mx-0 md:my-0 md:flex-wrap md:gap-2 md:overflow-visible md:p-0"
            aria-label="Show or hide people"
          >
            {series.map((s) => {
              const on = !hidden.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.key)}
                  onMouseEnter={() => setFocus(s.key)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(s.key)}
                  onBlur={() => setFocus(null)}
                  // 32px chip with a 44px hit area (the ::before reaches into the row's padding).
                  className="relative inline-flex min-h-8 flex-none items-center rounded-full border px-3 text-[12.5px] font-semibold transition-colors before:absolute before:inset-x-0 before:-inset-y-1.5 md:min-h-9 md:px-3.5 md:text-sm md:before:hidden"
                  style={{ borderColor: s.color, background: on ? s.color : "transparent", color: on ? "#17120a" : "#c2b294" }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-mist md:hidden">Tap a name to show or hide their line</p>
        </div>
      )}
    </div>
  );
}
