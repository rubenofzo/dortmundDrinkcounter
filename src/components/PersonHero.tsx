import type { Player } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import type { PlayerStats } from "@/lib/stats";
import { formatClock } from "@/lib/time";
import { LoadSparkline } from "./AlcoholLoad";
import { PlayerDot } from "./ui";

/** Hero card of a person's page: name, totals and the big "Still in the system" KPI. */
export function PersonHero({ player, s }: { player: Player; s: PlayerStats }) {
  const load = s.load.current;
  return (
    <section className="overflow-hidden rounded-2xl bg-foam text-ink shadow-[0_12px_30px_rgba(0,0,0,0.35)] md:rounded-[20px]">
      <div className="stripe h-2" />
      <div className="flex flex-col gap-4 p-4 md:grid md:grid-cols-2 md:gap-8 md:p-7">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <PlayerDot color={player.color} size={16} />
            <h1 className="font-display text-[34px] leading-none uppercase md:text-5xl">{player.name}</h1>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center md:text-left">
            <Big label="Points" value={formatPoints(s.points)} />
            <Big label="Drinks" value={String(s.drinks)} />
            <Big label="Weekend peak" value={s.load.peak ? `${Math.round(s.load.peak.grams)} g` : "–"} sub={s.load.peak ? formatClock(s.load.peak.at) : undefined} />
          </dl>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-hall px-4 py-3 text-foam">
          <span className="text-[11px] font-bold tracking-[0.14em] text-mist uppercase">Still in the system</span>
          <span className="font-display text-[48px] leading-none text-accent-light md:text-[56px]">{Math.round(load)} g</span>
          <span className="text-[15px]">still processing {formatPoints(load / 10)} drinks</span>
          <LoadSparkline curve={s.load.curve} color={player.color} />
          <span className="text-[11.5px] text-mist">Last 12 hours. Rough estimate for fun. Not a sobriety or driving check.</span>
        </div>
      </div>
    </section>
  );
}

function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col rounded-xl bg-foam-line/40 px-2 py-2.5 md:bg-transparent md:p-0">
      <dt className="text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase">{label}</dt>
      <dd className="font-display text-[30px] leading-tight md:text-[40px]">{value}</dd>
      {sub && <span className="text-[11.5px] text-ink-muted">{sub}</span>}
    </div>
  );
}
