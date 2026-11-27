"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
