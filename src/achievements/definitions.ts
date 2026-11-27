import { berlinParts, HOUR_MS, TRIP_DAYS, dayKey, hourStart } from "@/lib/time";
import type { Drink } from "@/lib/data";
import type { AchievementContext, AchievementDefinition } from "./types";

/*
 * The 24 achievements. None of them looks at `loggedByPlayerId`: who tapped the button is
 * irrelevant, only who drank. Group rules (Early Bird, Last One Standing, Century) look at
 * `ctx.days`, which covers everybody's drinks up to the moment being evaluated.
 */

const MINUTE_MS = 60_000;

const count = (ctx: AchievementContext, test: (d: Drink) => boolean) => ctx.mine.filter(test).length;

/** Largest number of a player's drinks matching `test` in one bucket (hour or day). */
function maxPerBucket(ctx: AchievementContext, test: (d: Drink) => boolean, bucket: (d: Drink) => string | number) {
  const counts = new Map<string | number, number>();
  let best = 0;
  for (const d of ctx.mine) {
    if (!test(d)) continue;
    const key = bucket(d);
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    best = Math.max(best, n);
  }
  return best;
}

const isHalbe = (d: Drink) => /pils/i.test(d.name) && /halbe/i.test(d.name);
const isCustom = (d: Drink) => d.category === "Custom" || d.drinkTypeId === null;

/** Longest run of consecutive hour buckets (in ms) in a sorted list of distinct hour starts. */
function longestHourRun(hours: number[]): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < hours.length; i++) {
    run = i > 0 && hours[i] - hours[i - 1] === HOUR_MS ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

function distinctHours(ctx: AchievementContext): number[] {
  return [...new Set(ctx.mine.map((d) => hourStart(d.at)))].sort((a, b) => a - b);
}

function categoriesByDay(ctx: AchievementContext): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const d of ctx.mine) {
    const key = dayKey(d.at);
    if (!out.has(key)) out.set(key, new Set());
    out.get(key)!.add(d.category);
  }
  return out;
}

/** Berlin clock hours (0-23) this player drank in, per day key. */
function clockHoursByDay(ctx: AchievementContext): Map<string, Set<number>> {
  const out = new Map<string, Set<number>>();
  for (const d of ctx.mine) {
    const key = dayKey(d.at);
    if (!out.has(key)) out.set(key, new Set());
    out.get(key)!.add(berlinParts(d.at).hour);
  }
  return out;
}

/** Longest run of consecutive hour-wins. */
function winRun(wins: readonly number[]): number {
  return longestHourRun([...wins]);
}

const STEADY_HOURS = [20, 21, 22, 23, 0];
const CENTURY = 100;

export const achievements: AchievementDefinition[] = [
  {
    id: "first-round",
    name: "First Round",
    description: "Log your first drink.",
    icon: "🍺",
    check: (c) => c.mine.length >= 1,
  },
  {
    id: "prost",
    name: "Prost!",
    description: "Drink within 2 minutes of 3 or more others.",
    icon: "🍻",
    check: (c) =>
      c.mine.some((m) => {
        const others = new Set<number>();
        for (const d of c.drinks) {
          if (d.playerId !== m.playerId && Math.abs(d.at - m.at) <= 2 * MINUTE_MS) others.add(d.playerId);
        }
        return others.size >= 3;
      }),
  },
  {
    id: "hour-champion",
    name: "Hour Champion",
    description: "Win an hour on the leaderboard.",
    icon: "👑",
    check: (c) => c.hourWins.length >= 1,
    progress: (c) => [c.hourWins.length, 1],
  },
  {
    id: "hat-trick",
    name: "Hat Trick",
    description: "Win 3 hours.",
    icon: "🎩",
    check: (c) => c.hourWins.length >= 3,
    progress: (c) => [c.hourWins.length, 3],
  },
  {
    id: "dynasty",
    name: "Dynasty",
    description: "Win 3 hours in a row.",
    icon: "🏰",
    check: (c) => winRun(c.hourWins) >= 3,
    progress: (c) => [winRun(c.hourWins), 3],
  },
  {
    id: "halbe-hero",
    name: "Halbe Hero",
    description: "5 Pils Halbe in total.",
    icon: "🥨",
    check: (c) => count(c, isHalbe) >= 5,
    progress: (c) => [count(c, isHalbe), 5],
  },
  {
    id: "dortmund-local",
    name: "Dortmund Local",
    description: "10 beers in total.",
    icon: "🟡",
    check: (c) => count(c, (d) => d.category === "Beer") >= 10,
    progress: (c) => [count(c, (d) => d.category === "Beer"), 10],
  },
  {
    id: "shot-caller",
    name: "Shot Caller",
    description: "3 shots in one hour.",
    icon: "🎯",
    check: (c) => maxPerBucket(c, (d) => d.category === "Shots", (d) => hourStart(d.at)) >= 3,
    progress: (c) => [maxPerBucket(c, (d) => d.category === "Shots", (d) => hourStart(d.at)), 3],
  },
  {
    id: "wine-mom",
    name: "Wine Mom",
    description: "4 glasses of wine in one day.",
    icon: "🍷",
    check: (c) => maxPerBucket(c, (d) => d.category === "Wine", (d) => dayKey(d.at)) >= 4,
    progress: (c) => [maxPerBucket(c, (d) => d.category === "Wine", (d) => dayKey(d.at)), 4],
  },
  {
    id: "spritz-oclock",
    name: "Spritz o'Clock",
    description: "Drink an Aperol Spritz before 17:00.",
    icon: "🍊",
    // Daytime only: the day starts at 06:00, so a 03:00 spritz doesn't count as "before 17:00".
    check: (c) =>
      c.mine.some((d) => {
        const h = berlinParts(d.at).hour;
        return /aperol/i.test(d.name) && h >= 6 && h < 17;
      }),
  },
  {
    id: "connoisseur",
    name: "Connoisseur",
    description: "Try 6 different drinks from the menu.",
    icon: "🧐",
    check: (c) => new Set(c.mine.filter((d) => d.drinkTypeId !== null).map((d) => d.drinkTypeId)).size >= 6,
    progress: (c) => [new Set(c.mine.filter((d) => d.drinkTypeId !== null).map((d) => d.drinkTypeId)).size, 6],
  },
  {
    id: "mad-scientist",
    name: "Mad Scientist",
    description: "Log a custom drink.",
    icon: "🧪",
    check: (c) => c.mine.some(isCustom),
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Make the first drink of the whole group on a day.",
    icon: "🌅",
    check: (c) => [...c.days.values()].some((day) => day.firstIds.has(c.player.id)),
  },
  {
    id: "breakfast-of-champions",
    name: "Breakfast of Champions",
    description: "A drink between 06:00 and 11:00.",
    icon: "🥞",
    check: (c) =>
      c.mine.some((d) => {
        const h = berlinParts(d.at).hour;
        return h >= 6 && h < 11;
      }),
  },
  {
    id: "last-one-standing",
    name: "Last One Standing",
    description: "Make the last drink of the group on a night (after 02:00).",
    icon: "🦉",
    // A night is settled once nobody has drunk for 2 hours or the day has ended (06:00),
    // so the badge isn't handed out and then taken by a later drink. Later drinks don't revoke it.
    check: (c) =>
      [...c.days.values()].some((day) => {
        if (!day.lastIds.has(c.player.id)) return false;
        const h = berlinParts(day.lastAt).hour;
        if (h < 2 || h >= 6) return false;
        return c.at >= day.lastAt + 2 * HOUR_MS || c.at >= day.endsAt;
      }),
  },
  {
    id: "marathon",
    name: "Marathon",
    description: "A drink in 6 consecutive hours.",
    icon: "🏃",
    check: (c) => longestHourRun(distinctHours(c)) >= 6,
    progress: (c) => [longestHourRun(distinctHours(c)), 6],
  },
  {
    id: "century",
    name: "Century",
    description: "The group reaches 100 points in a day. Everyone who drank that day gets it.",
    icon: "💯",
    check: (c) => [...c.days.values()].some((day) => day.points >= CENTURY && day.playerIds.has(c.player.id)),
  },
  {
    id: "steady-eddie",
    name: "Steady Eddie",
    description: "At least 1 drink in every hour from 20:00 to 01:00 on one night.",
    icon: "🐢",
    check: (c) => [...clockHoursByDay(c).values()].some((hours) => STEADY_HOURS.every((h) => hours.has(h))),
    progress: (c) => [
      Math.max(0, ...[...clockHoursByDay(c).values()].map((hours) => STEADY_HOURS.filter((h) => hours.has(h)).length)),
      STEADY_HOURS.length,
    ],
  },
  {
    id: "comeback-kid",
    name: "Comeback Kid",
    description: "Win an hour after 3 hours with no drinks.",
    icon: "🔁",
    check: (c) =>
      c.hourWins.some(
        (h) =>
          c.mine.some((d) => d.at < h - 3 * HOUR_MS) &&
          !c.mine.some((d) => d.at >= h - 3 * HOUR_MS && d.at < h),
      ),
  },
  {
    id: "liter-club",
    name: "Liter Club",
    description: "Drink 5 litres in total over the weekend.",
    icon: "🪣",
    check: (c) => c.mine.reduce((s, d) => s + d.ml, 0) >= 5000,
    progress: (c) => [Math.round(c.mine.reduce((s, d) => s + d.ml, 0) / 100) / 10, 5],
  },
  {
    id: "all-rounder",
    name: "All-Rounder",
    description: "A beer, a wine, a mixed drink and a shot in one day.",
    icon: "🎨",
    check: (c) => [...categoriesByDay(c).values()].some((cats) => ["Beer", "Wine", "Mixed", "Shots"].every((k) => cats.has(k))),
    progress: (c) => [
      Math.max(0, ...[...categoriesByDay(c).values()].map((cats) => ["Beer", "Wine", "Mixed", "Shots"].filter((k) => cats.has(k)).length)),
      4,
    ],
  },
  {
    id: "sticky-fingers",
    name: "Sticky Fingers",
    description: "Have a drink undone 3 times.",
    icon: "🍯",
    hidden: true,
    check: (c) => c.deletedCount >= 3,
  },
  {
    id: "weekend-warrior",
    name: "Weekend Warrior",
    description: "Drink on all three days of the trip.",
    icon: "🗓️",
    check: (c) => {
      const days = new Set(c.mine.map((d) => dayKey(d.at)));
      return TRIP_DAYS.every((k) => days.has(k));
    },
    progress: (c) => {
      const days = new Set(c.mine.map((d) => dayKey(d.at)));
      return [TRIP_DAYS.filter((k) => days.has(k)).length, TRIP_DAYS.length];
    },
  },
  {
    id: "collector",
    name: "Collector",
    description: "Unlock 10 other achievements.",
    icon: "🏆",
    check: (c) => [...c.unlockedIds].filter((id) => id !== "collector").length >= 10,
    progress: (c) => [[...c.unlockedIds].filter((id) => id !== "collector").length, 10],
  },
];
