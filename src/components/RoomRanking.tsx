import clsx from "clsx";
import Link from "next/link";
import type { Hub } from "@/lib/data";
import { formatPoints } from "@/lib/drinks";
import { rankRooms } from "@/lib/rooms";
import { HallPanel, PlayerDot, SectionTitle } from "./ui";

/** Leaderboard "Rooms" tab: rooms ranked by their members' total points over the weekend. */
export function RoomRanking({ hub }: { hub: Hub }) {
  const rows = rankRooms(hub);
  return (
    <HallPanel className="flex flex-col gap-3">
      <SectionTitle className="uppercase">Rooms · whole weekend</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-mist">
          No rooms yet. Make them on the{" "}
          <Link href="/people" className="font-bold text-accent-light">
            People
          </Link>{" "}
          page.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((r) => {
            const lead = r.rank === 1 && r.points > 0;
            return (
              <li
                key={r.room.id}
                className={clsx(
                  "flex min-h-16 items-center gap-3 rounded-xl px-3.5 py-2.5 md:px-5",
                  lead ? "bg-accent text-foam" : "bg-hall-light/60 text-foam",
                )}
              >
                <span className={clsx("w-8 flex-none text-center font-display text-[28px] leading-none", lead ? "text-foam" : "text-mist")}>
                  {r.rank}
                </span>
                <span aria-hidden className="text-[24px] leading-none">
                  {r.room.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-bold md:text-lg">{r.room.name}</span>
                  <span className={clsx("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]", lead ? "text-foam/80" : "text-mist")}>
                    {r.members.length === 0
                      ? "Nobody yet"
                      : r.members.map((p) => (
                          <span key={p.id} className="inline-flex items-center gap-1">
                            <PlayerDot color={p.color} size={8} on="hall" />
                            {p.name}
                          </span>
                        ))}
                  </span>
                </span>
                <span className="text-right font-display text-[26px] leading-none md:text-[32px]">
                  {formatPoints(r.points)}
                  <span className={clsx("ml-1 font-sans text-[11px] font-semibold uppercase", lead ? "text-foam/80" : "text-mist")}>pts</span>
                  <span className={clsx("block font-sans text-[12px] font-normal", lead ? "text-foam/80" : "text-mist")}>
                    {r.drinks} {r.drinks === 1 ? "drink" : "drinks"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <Link href="/people" className="inline-flex min-h-11 items-center text-[13px] font-semibold text-accent-light">
        Edit rooms on the People page →
      </Link>
    </HallPanel>
  );
}
