"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRoom, deleteRoom, setRoom } from "@/app/roomActions";
import type { Player, Room } from "@/lib/data";
import { MAX_ROOM_SIZE, ROOM_EMOJIS } from "@/lib/rooms";
import { HallPanel, PlayerDot, SectionTitle } from "./ui";

/**
 * Rooms on the People page: anyone can make a room, put people in it (at most 4) or take them
 * out. A person in another room moves over. Empty rooms can be deleted.
 */
export function RoomsEditor({ rooms, players }: { rooms: Room[]; players: Player[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(ROOM_EMOJIS[0]);

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) =>
    start(async () => {
      const r = await action();
      if (r.ok) {
        setError(null);
        after?.();
        router.refresh();
      } else setError(r.error);
    });

  const roomName = new Map(rooms.map((r) => [r.id, r.name]));
  const homeless = players.filter((p) => p.roomId === null);

  return (
    <HallPanel className="flex flex-col gap-3">
      <div>
        <SectionTitle className="uppercase">Rooms</SectionTitle>
        <p className="text-[13px] text-mist">
          Up to {MAX_ROOM_SIZE} people per room. Rooms compete on the leaderboard.
        </p>
      </div>

      {rooms.length > 0 && (
        <ul className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:gap-3">
          {rooms.map((room) => {
            const members = players.filter((p) => p.roomId === room.id);
            const full = members.length >= MAX_ROOM_SIZE;
            const others = players.filter((p) => p.roomId !== room.id);
            return (
              <li key={room.id} className="flex flex-col gap-2 rounded-xl bg-foam p-3 text-ink">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-[22px] leading-none">{room.icon}</span>
                  <span className="min-w-0 flex-1 truncate font-display text-[20px] uppercase">{room.name}</span>
                  <span className="tabular text-[13px] text-ink-muted">
                    {members.length}/{MAX_ROOM_SIZE}
                  </span>
                </div>
                {members.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {members.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => setRoom({ playerId: p.id, roomId: null }))}
                          aria-label={`Take ${p.name} out of ${room.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foam-line bg-white/70 pr-2.5 pl-3 text-[14px] font-bold disabled:opacity-60"
                        >
                          <PlayerDot color={p.color} size={10} />
                          {p.name}
                          <span aria-hidden className="text-ink-muted">×</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-ink-muted">Nobody yet.</p>
                )}
                <div className="flex gap-2">
                  {!full && others.length > 0 && (
                    <select
                      value=""
                      disabled={pending}
                      aria-label={`Add someone to ${room.name}`}
                      onChange={(e) => {
                        const playerId = Number(e.target.value);
                        if (playerId) run(() => setRoom({ playerId, roomId: room.id }));
                      }}
                      className="min-h-11 min-w-0 flex-1 rounded-xl border border-foam-line bg-white px-3 text-base"
                    >
                      <option value="">＋ Add someone…</option>
                      {others.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.roomId !== null ? ` (from ${roomName.get(p.roomId)})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {members.length === 0 && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteRoom({ roomId: room.id }))}
                      className="min-h-11 rounded-xl border border-foam-line px-3.5 text-[14px] font-bold text-chip-dark disabled:opacity-60"
                    >
                      Delete room
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {homeless.length > 0 && rooms.length > 0 && (
        <p className="text-[13px] text-mist">No room yet: {homeless.map((p) => p.name).join(", ")}</p>
      )}

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createRoom({ name, icon }), () => setName(""));
        }}
      >
        <div className="no-scrollbar -mx-3.5 flex gap-1.5 overflow-x-auto px-3.5">
          {ROOM_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              aria-pressed={icon === e}
              aria-label={`Use ${e}`}
              className={`h-11 w-11 flex-none rounded-full border text-[20px] ${icon === e ? "border-accent bg-accent/25" : "border-line bg-hall-light/60"}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="New room, e.g. Room 12"
            aria-label="Room name"
            className="min-h-14 min-w-0 flex-1 rounded-xl border border-line bg-hall-light/60 px-3.5 text-base text-foam placeholder:text-mist"
          />
          <button
            type="submit"
            disabled={pending || name.trim().length === 0}
            className="min-h-14 rounded-xl bg-accent px-5 font-display text-lg text-foam uppercase disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="text-[14px] font-bold text-accent-light">
          {error}
        </p>
      )}
    </HallPanel>
  );
}
