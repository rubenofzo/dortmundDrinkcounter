import type { Hub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { groupStats, litreComparison } from "@/lib/stats";
import { blockLabel, dayLabel, formatClock, formatDayTime, hourLabel } from "@/lib/time";
import { CategoryPie } from "./CategoryMix";
import { ShowMore } from "./ShowMore";
import { CardPanel, KpiCard, PlayerDot, SectionTitle } from "./ui";

/** Group fun stats for the home page: KPI cards, drinks per category pie, share per person. */
export function GroupStats({ hub }: { hub: Hub }) {
  const g = groupStats(hub.drinks, hub.players, hub.now);
  const totalPoints = g.points || 1;
  const foldShares = g.shares.length > 7;
  const shareRow = (s: (typeof g.shares)[number]) => (
                <li key={s.player.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[15px]">
                    <PlayerDot color={s.player.color} size={12} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{s.player.name}</span>
                    <span className="text-ink-muted">{Math.round((s.points / totalPoints) * 100)}%</span>
                  </div>
                  <span className="h-2 overflow-hidden rounded-full bg-foam-line">
                    <span className="block h-full" style={{ width: `${(s.points / totalPoints) * 100}%`, background: s.player.color }} />
                  </span>
                </li>
  );
  return (
    <section className="flex flex-col gap-3 md:gap-5">
      <SectionTitle className="uppercase">Fun stats</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
        <KpiCard icon="🍻" label="Total drinks" value={g.drinks} />
        <KpiCard icon="💯" label="Total points" value={formatPoints(g.points)} />
        <KpiCard icon="🧪" label="Pure alcohol" value={`${Math.round(g.pureMl)} ml`} />
        <KpiCard icon="🍺" label="Beer equivalent" value={g.beerEquivalent.toFixed(1)} sub="Pils 0.5 L" />
        <KpiCard icon="🪣" label="Liquid" value={`${g.liters.toFixed(1)} L`} sub={litreComparison(g.liters)} />
        <KpiCard
          icon="🔥"
          label="Biggest block"
          value={g.biggestHour ? `${formatPoints(g.biggestHour.points)} pts` : "–"}
          sub={g.biggestHour ? `${g.biggestHour.player.name}, ${blockLabel(g.biggestHour.hour)}` : undefined}
        />
        <KpiCard
          icon="🎉"
          label="Busiest block"
          value={g.busiestHour ? `${formatPoints(g.busiestHour.points)} pts` : "–"}
          sub={g.busiestHour ? blockLabel(g.busiestHour.hour) : undefined}
        />
        <KpiCard
          icon="⛰️"
          label="Peak load"
          value={g.peak ? `${Math.round(g.peak.grams)} g` : "–"}
          sub={g.peak ? `${g.peak.player.name}, ${formatDayTime(g.peak.at)}` : undefined}
        />
        <KpiCard
          icon="🏭"
          label="Most processed"
          value={g.mostProcessed ? `${Math.round(g.mostProcessed.grams)} g` : "–"}
          sub={g.mostProcessed?.player.name}
        />
        <KpiCard
          icon="🏃"
          label="Longest streak"
          value={g.streak ? `${g.streak.value.hours} h` : "–"}
          sub={g.streak ? `${g.streak.player.name}, from ${hourLabel(g.streak.value.from)}` : undefined}
        />
      </div>

      {g.days.length > 0 && (
        <CardPanel>
          <h3 className="mb-2 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">Early Bird and Last One Standing</h3>
          <ul className="flex flex-col gap-2 text-[15px]">
            {g.days.map((d) => (
              <li key={d.day} className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-4">
                <span className="font-semibold md:w-32">{dayLabel(d.day)}</span>
                <span>🌅 {d.early.player?.name ?? "?"} <span className="text-ink-muted">{formatClock(d.early.at)}</span></span>
                <span>🦉 {d.late.player?.name ?? "?"} <span className="text-ink-muted">{formatClock(d.late.at)}</span></span>
              </li>
            ))}
          </ul>
        </CardPanel>
      )}

      <div className="grid gap-3 md:grid-cols-2 md:gap-5">
        <CardPanel>
          <h3 className="mb-2 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">Drinks per category</h3>
          <CategoryPie mix={g.mix} />
        </CardPanel>
        <CardPanel>
          <h3 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">Share of the group total</h3>
          {g.shares.length === 0 ? (
            <p className="text-sm text-ink-muted">No drinks yet.</p>
          ) : (
            <>
              <ul className="flex flex-col gap-2.5">{(foldShares ? g.shares.slice(0, 5) : g.shares).map(shareRow)}</ul>
              {foldShares && (
                <ShowMore tone="card" label={`Show all ${g.shares.length}`}>
                  <ul className="mt-2.5 flex flex-col gap-2.5">{g.shares.slice(5).map(shareRow)}</ul>
                </ShowMore>
              )}
            </>
          )}
        </CardPanel>
      </div>
    </section>
  );
}
