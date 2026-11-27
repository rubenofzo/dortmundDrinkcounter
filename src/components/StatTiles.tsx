import { formatPoints } from "@/lib/drinks";
import type { PlayerStats } from "@/lib/stats";
import { dayLabel, formatClock, formatDayTime, hourLabel } from "@/lib/time";
import { CardPanel, KpiCard } from "./ui";
import { CategoryMixBar } from "./CategoryMix";

/** "3 h 20 min" */
export function formatSpan(ms: number): string {
  const min = Math.round(ms / 60_000);
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${min % 60} min` : `${min} min`;
}

/** The fun-stat KPI tiles of one person (2 columns on phones). */
export function StatTiles({ s }: { s: PlayerStats }) {
  return (
    <div className="flex flex-col gap-3 md:gap-5">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
        <KpiCard icon="🍺" label="Beer equivalent" value={s.beerEquivalent.toFixed(1)} sub="Pils 0.5 L" />
        <KpiCard icon="🧪" label="Pure alcohol" value={`${Math.round(s.pureMl)} ml`} />
        <KpiCard icon="🪣" label="Liquid" value={`${s.liters.toFixed(1)} L`} />
        <KpiCard
          icon="⚡"
          label="Pace"
          value={s.pace ? `${formatPoints(s.pace.perHour)}/h` : "–"}
          sub={s.pace ? `since ${formatClock(s.pace.since)}` : "points per hour"}
        />
        <KpiCard icon="🔥" label="Best hour" value={s.bestHour ? `${formatPoints(s.bestHour.points)} pts` : "–"} sub={s.bestHour ? hourLabel(s.bestHour.hour) : undefined} />
        <KpiCard
          icon="🏃"
          label="Longest streak"
          value={s.streak ? `${s.streak.hours} h` : "–"}
          sub={s.streak ? `from ${hourLabel(s.streak.from)}` : "hours in a row"}
        />
        <KpiCard
          icon="⛰️"
          label="Peak load"
          value={s.load.peak ? `${Math.round(s.load.peak.grams)} g` : "–"}
          sub={s.load.peak ? formatDayTime(s.load.peak.at) : undefined}
        />
        <KpiCard icon="🏭" label="Processed" value={`${Math.round(s.load.processed)} g`} sub="alcohol already gone" />
        <KpiCard icon="🏜️" label="Longest dry spell" value={s.drySpell ? formatSpan(s.drySpell.ms) : "–"} sub={s.drySpell ? `from ${formatClock(s.drySpell.from)}` : "12:00–02:00"} />
        <KpiCard
          icon={s.favourite?.icon ?? "⭐"}
          label="Favourite"
          value={<span className="text-[20px] md:text-[28px]">{s.favourite?.name ?? "–"}</span>}
          sub={s.favourite ? `${s.favourite.count}×` : undefined}
        />
      </div>
      {s.days.length > 0 && (
        <CardPanel>
          <h3 className="mb-2 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">First and last drink per day</h3>
          <ul className="flex flex-col gap-1.5 text-[15px]">
            {s.days.map((d) => (
              <li key={d.day} className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-semibold">{dayLabel(d.day)}</span>
                <span className="text-ink-muted">
                  🌅 {formatClock(d.first.at)} · 🦉 {formatClock(d.last.at)}
                </span>
              </li>
            ))}
          </ul>
        </CardPanel>
      )}
      <CardPanel>
        <h3 className="mb-2 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">Drink mix</h3>
        <CategoryMixBar mix={s.mix} />
      </CardPanel>
    </div>
  );
}
