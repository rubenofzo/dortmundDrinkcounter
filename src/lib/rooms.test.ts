import { describe, expect, it } from "vitest";
import type { Drink, Player, Room } from "./data";
import { rankRooms, roomChartData } from "./rooms";

const player = (id: number, roomId: number | null): Player => ({
  id, name: `P${id}`, slug: `p${id}`, colorIndex: id, color: "#fff", roomId,
});
const drink = (playerId: number, points: number) => ({ playerId, points }) as Drink;
const rooms: Room[] = [
  { id: 1, name: "Attic", icon: "🛏️" },
  { id: 2, name: "Basement", icon: "🔥" },
  { id: 3, name: "Cellar", icon: "🍺" },
];

describe("rankRooms", () => {
  it("adds up members' points, skips people without a room, and shares tied ranks", () => {
    const players = [player(1, 1), player(2, 1), player(3, 2), player(4, null), player(5, 3)];
    const drinks = [drink(1, 2), drink(2, 1), drink(3, 3), drink(4, 10), drink(5, 1)];
    const r = rankRooms({ rooms, players, drinks });
    expect(r.map((x) => [x.room.name, x.points, x.drinks, x.rank, x.members.length])).toEqual([
      ["Attic", 3, 2, 1, 2],
      ["Basement", 3, 1, 1, 1],
      ["Cellar", 1, 1, 3, 1],
    ]);
  });
  it("lists empty rooms with 0 points", () => {
    expect(rankRooms({ rooms, players: [], drinks: [] }).map((x) => x.points)).toEqual([0, 0, 0]);
  });
});

describe("roomChartData", () => {
  it("gives one series per room with drinks, adding up its members", () => {
    const at = Date.UTC(2026, 10, 27, 18);
    const players = [player(1, 1), player(2, 1), player(3, null)];
    const drinks = [1, 2, 3].map((id) => ({ id, playerId: id, points: 1, at }) as Drink);
    const c = roomChartData({ rooms, players, drinks, now: at });
    expect(c.series.map((s) => s.name)).toEqual(["🛏️ Attic"]);
    expect(c.points[0][c.series[0].key]).toBe(2);
  });
});
