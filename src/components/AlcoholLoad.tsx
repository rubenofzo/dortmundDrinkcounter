"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatClock } from "@/lib/time";

/** Small area chart of the "still in the system" curve (grams) over the last 12 hours. */
export function LoadSparkline({ curve, color = "#e53a2f", height = 72 }: { curve: { at: number; grams: number }[]; color?: string; height?: number }) {
  const data = curve.map((c) => ({ at: c.at, grams: Math.round(c.grams * 10) / 10 }));
  return (
    <div style={{ height }} className="w-full" role="img" aria-label="Alcohol still in the system over the last 12 hours">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="at" hide />
          <YAxis hide domain={[0, (max: number) => Math.max(max, 10)]} />
          <Tooltip
            contentStyle={{ background: "#fbf5e6", border: "none", borderRadius: 10, color: "#17120a", fontSize: 13 }}
            labelFormatter={(v) => formatClock(Number(v))}
            formatter={(v) => [`${v} g`, "In the system"]}
          />
          <Area type="monotone" dataKey="grams" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.3} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type LoadSeries = { key: string; name: string; color: string; curve: { at: number; grams: number }[] };

/**
 * Home "Still in the system": the same curve as a person's page, one line per person. `series` is
 * ordered by current load; the first `shown` start visible and the rest start hidden. Tap a name
 * chip (small, so ~15 fit on a phone) to show or hide that line.
 */
export function LoadChart({ series, shown = 5, height = 200 }: { series: LoadSeries[]; shown?: number; height?: number }) {
  // Names the viewer flipped; the default (top `shown` on) survives the 15-second refresh reordering.
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const isOn = (key: string, i: number) => (i < shown) !== flipped.has(key);
  const data = useMemo(() => {
    const first = series[0]?.curve ?? [];
    return first.map((c, i) => {
      const row: Record<string, number> = { at: c.at };
      for (const s of series) row[s.key] = Math.round((s.curve[i]?.grams ?? 0) * 10) / 10;
      return row;
    });
  }, [series]);
  const toggle = (key: string) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return (
    <div className="flex flex-col gap-2.5">
      <div style={{ height }} className="w-full" role="img" aria-label="Alcohol still in the system over the last 12 hours">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#4a3b22" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="at"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => formatClock(Number(v))}
              tick={{ fill: "#c2b294", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#4a3b22" }}
              minTickGap={24}
            />
            <YAxis tick={{ fill: "#c2b294", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} unit=" g" width={46} />
            <Tooltip
              contentStyle={{ background: "#fbf5e6", border: "none", borderRadius: 10, color: "#17120a", fontSize: 13 }}
              labelStyle={{ fontWeight: 700 }}
              itemStyle={{ padding: 0 }}
              labelFormatter={(v) => formatClock(Number(v))}
              itemSorter={(item) => -Number(item.value)}
              formatter={(v, name) => [`${v} g`, name]}
            />
            {series
              .filter((s, i) => isOn(s.key, i))
              .map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {series.length > 1 && (
        <div className="flex flex-wrap gap-1" aria-label="Show or hide people">
          {series.map((s, i) => {
            const on = isOn(s.key, i);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s.key)}
                className="inline-flex min-h-7 max-w-[10ch] items-center truncate rounded-full border px-2 text-[11.5px] leading-none font-semibold transition-colors"
                style={{ borderColor: s.color, background: on ? s.color : "transparent", color: on ? "#17120a" : "#c2b294" }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
