import type { Drink, Player } from "@/lib/data";
import type { RarityTier } from "./rarity";

/** What happened on one 06:00-to-06:00 day, as of the moment being evaluated. */
export type DayInfo = {
  key: string;
  /** Group points on that day so far. */
  points: number;
  /** Players who drank that day. */
  playerIds: ReadonlySet<number>;
  /** Players who made the group's first drink of the day (several if logged at the same ms). */
  firstIds: ReadonlySet<number>;
  /** Players who made the group's last drink of the day so far. */
  lastIds: ReadonlySet<number>;
  /** Time of the group's last drink so far, ms. */
  lastAt: number;
  /** When the day ends (06:00 the next morning), ms. */
  endsAt: number;
};

/**
 * Everything an achievement can look at. The engine builds one of these for every player at
 * every moment something happens (a drink, an undo, the end of a 3-hour block or a night), in time
 * order, so a check sees the world as it was at that moment.
 */
export type AchievementContext = {
  player: Player;
  /** The moment being evaluated, ms. Blocks that ended at or before it count as completed. */
  at: number;
  /** Everything the group drank up to `at`, oldest first. */
  drinks: readonly Drink[];
  /** This player's drinks up to `at`, oldest first. */
  mine: readonly Drink[];
  /** How many of this player's drinks were undone or deleted up to `at`. */
  deletedCount: number;
  /** Leaderboard blocks (start ms) this player won, completed blocks only, oldest first. */
  blockWins: readonly number[];
  /** Each player's room id (null without a room), for room-based achievements. */
  roomOf: ReadonlyMap<number, number | null>;
  /** Days seen so far, by day key. */
  days: ReadonlyMap<string, DayInfo>;
  /** Ids of the achievements this player has earned so far. */
  unlockedIds: ReadonlySet<string>;
};

export type AchievementDefinition = {
  /** Stable id; don't change it once used, or everyone "loses" and re-earns it. */
  id: string;
  name: string;
  description: string;
  /** One or two characters (an emoji). */
  icon: string;
  /** How hard it is to get. Fixed per achievement, not based on how many people have it. */
  tier: RarityTier;
  /** Hidden achievements show as ??? until someone earns them. */
  hidden?: boolean;
  /** True once the player has earned it. */
  check: (ctx: AchievementContext) => boolean;
  /** Optional progress for the locked view, e.g. [7, 10]. */
  progress?: (ctx: AchievementContext) => [current: number, target: number];
};
