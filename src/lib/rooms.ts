import { playerColor } from "./colors";
import type { Hub, Player, Room } from "./data";
import { blockChartData, type ChartPoint, type ChartSeries } from "./hours";

/** A room is our hotel room: at most this many people. */
export const MAX_ROOM_SIZE = 4;

/** Quick emoji choices for a new room (any emoji can be typed too). */
export const ROOM_EMOJIS = ["🛏️", "🏠", "🔥", "🦊", "🐝", "🍺", "🎄", "⚽"] as const;

export type RoomStanding = { room: Room; members: Player[]; points: number; drinks: number; rank: number };

const EPS = 1e-9;

/**
 * Rooms ranked by the total points of their members over the whole weekend (then name).
 * Every room is listed, also empty ones; ties share the rank (1, 1, 3).
 */
export function rankRooms(hub: Pick<Hub, "rooms" | "players" | "drinks">): RoomStanding[] {
  const roomOf = new Map(hub.players.map((p) => [p.id, p.roomId]));
  const totals = new Map<number, { points: number; drinks: number }>();
  for (const d of hub.drinks) {
    const roomId = roomOf.get(d.playerId);
    if (roomId == null) continue;
    const t = totals.get(roomId) ?? { points: 0, drinks: 0 };
    t.points += d.points;
    t.drinks += 1;
    totals.set(roomId, t);
  }
  const rows = hub.rooms
    .map((room) => ({
      room,
      members: hub.players.filter((p) => p.roomId === room.id),
      points: totals.get(room.id)?.points ?? 0,
      drinks: totals.get(room.id)?.drinks ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.points - a.points || a.room.name.localeCompare(b.room.name));
  rows.forEach((r, i) => {
    r.rank = i > 0 && Math.abs(rows[i - 1].points - r.points) < EPS ? rows[i - 1].rank : i + 1;
  });
  return rows;
}

/**
 * Data for `HourChart` with one line per room: each room's drinks are counted as if the room
 * were one player, so the chart adds up the room's points per 3-hour block. Rooms without
 * drinks are left out; colours follow room order.
 */
export function roomChartData(hub: Pick<Hub, "rooms" | "players" | "drinks" | "now">): { points: ChartPoint[]; series: ChartSeries[] } {
  const roomOf = new Map(hub.players.map((p) => [p.id, p.roomId]));
  const drinks = hub.drinks.flatMap((d) => {
    const roomId = roomOf.get(d.playerId);
    return roomId == null ? [] : [{ ...d, playerId: roomId }];
  });
  const asPlayers: Player[] = hub.rooms.map((r, i) => ({
    id: r.id,
    name: `${r.icon} ${r.name}`,
    slug: "",
    colorIndex: i,
    color: playerColor(i),
    roomId: r.id,
  }));
  return blockChartData(drinks, asPlayers, hub.now);
}
