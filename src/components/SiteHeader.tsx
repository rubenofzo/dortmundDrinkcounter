import Link from "next/link";
import { getHub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { getMe } from "@/lib/identity";
import { PlayerDot } from "./ui";

/**
 * Phones: logo row with "you" chip, meta line underneath (navigation lives in `BottomNav`).
 * Desktop: logo and meta on the left, nav on the right. "Change" opens the Who are you? picker
 * on home (`/?pick=1`).
 */
export async function SiteHeader() {
  const hub = await getHub();
  const me = await getMe(hub);
  const points = hub.drinks.reduce((s, d) => s + d.points, 0);
  const parts = [
    `${hub.players.length} ${hub.players.length === 1 ? "person" : "people"}`,
    `${hub.drinks.length} ${hub.drinks.length === 1 ? "drink" : "drinks"}`,
    `${formatPoints(points)} pts`,
  ];
  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-x-4 md:flex md:flex-wrap md:items-end md:justify-between md:gap-4 md:border-b md:border-line md:pb-6">
      <div className="contents md:flex md:flex-col md:gap-1.5">
        <span className="col-start-1 text-[9px] font-semibold tracking-[0.14em] text-accent uppercase md:text-[13px] md:tracking-[0.24em]">
          Drinkhub · 27–29 Nov
        </span>
        <Link href="/" className="col-start-1 mt-0.5 font-display text-[28px] leading-none font-bold tracking-wide text-foam uppercase no-underline md:mt-0 md:text-[52px]">
          Sticky <span className="text-accent">Dortmund</span>
        </Link>
        <span className="col-span-2 mt-1.5 text-[12.5px] text-mist md:mt-0 md:text-[15px]">{parts.join(" · ")}</span>
      </div>
      <nav className="col-start-2 row-span-2 row-start-1 flex items-center gap-1 md:flex-wrap md:gap-3">
        <Link href="/leaderboard" className="hidden px-3 py-3 text-[15px] font-semibold text-accent hover:text-foam md:inline">
          Leaderboard
        </Link>
        <Link href="/people" className="hidden px-3 py-3 text-[15px] font-semibold text-accent hover:text-foam md:inline">
          People
        </Link>
        <Link href="/achievements" className="hidden px-3 py-3 text-[15px] font-semibold text-accent hover:text-foam md:inline">
          Achievements
        </Link>
        <Link
          href="/?pick=1"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-accent px-3.5 text-[14px] font-bold text-accent hover:bg-accent hover:text-ink md:border-2 md:px-5 md:text-[15px]"
        >
          {me ? (
            <>
              <PlayerDot color={me.color} on="hall" />
              <span className="max-w-[9ch] truncate md:max-w-none">{me.name}</span>
            </>
          ) : (
            "Who are you?"
          )}
        </Link>
      </nav>
    </header>
  );
}
