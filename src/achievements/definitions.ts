import { berlinParts, blockEnd, blockStart, calendarDate, HOUR_MS, TRIP_DAYS, dayKey, hourStart } from "@/lib/time";
import type { Drink } from "@/lib/data";
import type { AchievementContext, AchievementDefinition } from "./types";

/*
 * The achievements. None of them looks at `loggedByPlayerId`: who tapped the button is
 * irrelevant, only who drank. Group rules (Early Bird, Last One Standing, Century) look at
 * `ctx.days`, which covers everybody's drinks up to the moment being evaluated.
 */

const MINUTE_MS = 60_000;

const count = (ctx: AchievementContext, test: (d: Drink) => boolean) => ctx.mine.filter(test).length;

/** Largest number of a player's drinks matching `test` in one bucket (hour, block or day). */
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

/** Longest run of consecutive block-wins (a block follows another when blockEnd(prev) === next). */
function winRun(wins: readonly number[]): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < wins.length; i++) {
    run = i > 0 && blockEnd(wins[i - 1]) === wins[i] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

const hourOf = (d: Drink) => berlinParts(d.at).hour;
const totalMl = (c: AchievementContext) => c.mine.reduce((s, d) => s + d.ml, 0);
const isSmallPils = (d: Drink) => /pils/i.test(d.name) && /small/i.test(d.name);
const isJaeger = (d: Drink) => /j[äa]ger/i.test(d.name);
const isSekt = (d: Drink) => /sekt|prosecco/i.test(d.name);
const isWeizen = (d: Drink) => /weizen/i.test(d.name);
const isGluhwein = (d: Drink) => /gl(ü|u|ue)hwein/i.test(d.name);
/** Most Glühweins this player had in one day (06:00 to 06:00). */
const gluhweinPerDay = (c: AchievementContext) => maxPerBucket(c, isGluhwein, (d) => dayKey(d.at));

/** Most distinct 3-hour blocks with a Glühwein in any one day. */
function marketCrawl(c: AchievementContext): number {
  const blocks = new Map<string, Set<number>>();
  for (const d of c.mine) {
    if (!isGluhwein(d)) continue;
    const key = dayKey(d.at);
    if (!blocks.has(key)) blocks.set(key, new Set());
    blocks.get(key)!.add(blockStart(d.at));
  }
  return Math.max(0, ...[...blocks.values()].map((b) => b.size));
}

/** Most distinct "night shift" hours (22, 23, 0, 1, 2, 3) in any one day. */
const NIGHT_HOURS = [22, 23, 0, 1, 2, 3];
const nightHours = (c: AchievementContext) =>
  Math.max(0, ...[...clockHoursByDay(c).values()].map((hours) => NIGHT_HOURS.filter((h) => hours.has(h)).length));

/** A drink 03:00-06:00 and another 06:00-10:00 on the same Berlin calendar morning. */
function zombie(c: AchievementContext): boolean {
  const early = new Set(c.mine.filter((d) => hourOf(d) >= 3 && hourOf(d) < 6).map((d) => calendarDate(d.at)));
  return c.mine.some((d) => hourOf(d) >= 6 && hourOf(d) < 10 && early.has(calendarDate(d.at)));
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
    name: "Block Champion",
    description: "Win a 3-hour block on the leaderboard.",
    icon: "👑",
    check: (c) => c.blockWins.length >= 1,
    progress: (c) => [c.blockWins.length, 1],
  },
  {
    id: "hat-trick",
    name: "Hat Trick",
    description: "Win 3 blocks.",
    icon: "🎩",
    check: (c) => c.blockWins.length >= 3,
    progress: (c) => [c.blockWins.length, 3],
  },
  {
    id: "dynasty",
    name: "Dynasty",
    description: "Win 3 blocks in a row.",
    icon: "🏰",
    check: (c) => winRun(c.blockWins) >= 3,
    progress: (c) => [winRun(c.blockWins), 3],
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
    description: "3 shots in one block.",
    icon: "🎯",
    check: (c) => maxPerBucket(c, (d) => d.category === "Shots", (d) => blockStart(d.at)) >= 3,
    progress: (c) => [maxPerBucket(c, (d) => d.category === "Shots", (d) => blockStart(d.at)), 3],
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
    description: "Win a block after a whole block (3 hours) with no drinks.",
    icon: "🔁",
    check: (c) =>
      c.blockWins.some((b) => {
        const prev = blockStart(b - 1);
        return c.mine.some((d) => d.at < prev) && !c.mine.some((d) => d.at >= prev && d.at < b);
      }),
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
    id: "quarter-century",
    name: "Quarter Century",
    description: "25 drinks in total.",
    icon: "🥉",
    check: (c) => c.mine.length >= 25,
    progress: (c) => [c.mine.length, 25],
  },
  {
    id: "half-century",
    name: "Half Century",
    description: "50 drinks in total.",
    icon: "🎖️",
    check: (c) => c.mine.length >= 50,
    progress: (c) => [c.mine.length, 50],
  },
  {
    id: "human-keg",
    name: "Human Keg",
    description: "10 litres in total.",
    icon: "🛢️",
    check: (c) => totalMl(c) >= 10000,
    progress: (c) => [Math.round(totalMl(c) / 100) / 10, 10],
  },
  {
    id: "beer-baron",
    name: "Beer Baron",
    description: "20 beers in total.",
    icon: "🤴",
    check: (c) => count(c, (d) => d.category === "Beer") >= 20,
    progress: (c) => [count(c, (d) => d.category === "Beer"), 20],
  },
  {
    id: "student-budget",
    name: "Student Budget",
    description: "10 small Pils in total.",
    icon: "💸",
    check: (c) => count(c, isSmallPils) >= 10,
    progress: (c) => [count(c, isSmallPils), 10],
  },
  {
    id: "jager-squad",
    name: "Jäger Squad",
    description: "5 Jägermeisters in total.",
    icon: "🌿",
    check: (c) => count(c, isJaeger) >= 5,
    progress: (c) => [count(c, isJaeger), 5],
  },
  {
    id: "prosecco-problems",
    name: "Prosecco Problems",
    description: "5 Sekt or Prosecco in total.",
    icon: "🥂",
    check: (c) => count(c, isSekt) >= 5,
    progress: (c) => [count(c, isSekt), 5],
  },
  {
    id: "sunrise-session",
    name: "Sunrise Session",
    description: "A drink between 05:00 and 08:00.",
    icon: "🌄",
    check: (c) => c.mine.some((d) => hourOf(d) >= 5 && hourOf(d) < 8),
  },
  {
    id: "night-shift",
    name: "Night Shift",
    description: "At least 1 drink in every hour from 22:00 to 04:00 on one night.",
    icon: "🌙",
    check: (c) => nightHours(c) >= NIGHT_HOURS.length,
    progress: (c) => [nightHours(c), NIGHT_HOURS.length],
  },
  {
    id: "zombie-mode",
    name: "Zombie Mode",
    description: "A drink between 03:00 and 06:00 and another between 06:00 and 10:00 the same morning.",
    icon: "🧟",
    check: zombie,
  },
  {
    id: "weisswurst-breakfast",
    name: "Weißwurst Breakfast",
    description: "A Weizen before 12:00.",
    icon: "🌭",
    check: (c) => c.mine.some((d) => isWeizen(d) && hourOf(d) >= 6 && hourOf(d) < 12),
  },
  // Glühwein (Christmas markets).
  {
    id: "christkindl",
    name: "Christkindl",
    description: "Drink your first Glühwein.",
    icon: "🎄",
    check: (c) => c.mine.some(isGluhwein),
  },
  {
    id: "warm-hands",
    name: "Warm Hands",
    description: "3 Glühweins in one day.",
    icon: "🔥",
    check: (c) => gluhweinPerDay(c) >= 3,
    progress: (c) => [gluhweinPerDay(c), 3],
  },
  {
    id: "gluhwein-five",
    name: "Glühwein Goblin",
    description: "5 Glühweins in one day.",
    icon: "🧌",
    check: (c) => gluhweinPerDay(c) >= 5,
    progress: (c) => [gluhweinPerDay(c), 5],
  },
  {
    id: "rudolph",
    name: "Rudolph the Red-Nosed Reindeer",
    description: "10 Glühweins in one day.",
    icon: "🦌",
    check: (c) => gluhweinPerDay(c) >= 10,
    progress: (c) => [gluhweinPerDay(c), 10],
  },
  {
    id: "market-crawl",
    name: "Market Crawl",
    description: "A Glühwein in 3 different 3-hour blocks on one day.",
    icon: "🧣",
    check: (c) => marketCrawl(c) >= 3,
    progress: (c) => [marketCrawl(c), 3],
  },
  {
    id: "gluhwein-weekend",
    name: "Glühwein Weekend",
    description: "A Glühwein on all three days of the trip.",
    icon: "🌨️",
    check: (c) => {
      const days = new Set(c.mine.filter(isGluhwein).map((d) => dayKey(d.at)));
      return TRIP_DAYS.every((k) => days.has(k));
    },
    progress: (c) => {
      const days = new Set(c.mine.filter(isGluhwein).map((d) => dayKey(d.at)));
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
