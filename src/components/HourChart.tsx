"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPoint, ChartSeries } from "@/lib/hours";

/** Points per hour, stacked by person, coloured by player. Data from `hourChartData` in `src/lib/hours.ts`. */
export function HourChart({ points, series, height = 240 }: { points: ChartPoint[]; series: ChartSeries[]; height?: number }) {
  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-mist">No drinks yet. The chart starts with the first one.</p>;
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="#4a3b22" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#c2b294", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#4a3b22" }} minTickGap={16} />
          <YAxis tick={{ fill: "#c2b294", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgb(229 58 47 / 0.1)" }}
            contentStyle={{ background: "#fbf5e6", border: "none", borderRadius: 10, color: "#17120a", fontSize: 13 }}
            formatter={(v) => (typeof v === "number" ? v.toFixed(1) : v)}
          />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} stackId="pts" fill={s.color} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
