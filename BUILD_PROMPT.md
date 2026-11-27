# Build prompt: Sticky Dortmund drink counter

Build **Drinkhub**, a small phone-first website where our group counts drinks during our
weekend away, **Sticky Dortmund, Friday 27 to Sunday 29 November 2026**. It needs to be usable
fast, so favour a working, polished first version over extras.

Model it on our existing app **PokerHub** (https://github.com/rubenofzo/PokerHub). Clone it
and read its `CLAUDE.md`, `README.md`, `src/app/globals.css`, `src/components/ui.tsx`,
`src/components/BottomNav.tsx`, `src/achievements/` and `src/lib/auth.ts` before writing code,
then reuse its structure, conventions and look wherever they fit. Don't copy poker-specific
things (money, sessions, sheet uploads).

## Stack (exactly the same as PokerHub)

- Next.js 16 App Router with server components and server actions, TypeScript, Tailwind 4,
  Drizzle ORM on Postgres, Recharts, clsx, zod, vitest.
- Hosted on Vercel with a Neon Postgres database; `scripts/migrate.mjs` runs migrations on every
  build, just like PokerHub, so deploying needs no manual migration step.
- Env vars: `DATABASE_URL`, `ADMIN_PASSWORD`.
- Note PokerHub's `AGENTS.md`: this Next.js version has breaking changes, so read the docs in
  `node_modules/next/dist/docs/` before writing Next-specific code.
- All times are **Europe/Berlin**. Hour buckets start on the hour in that zone.

## People and logging

- **Anyone can log a drink for anyone.** No passwords for logging.
- The first time a phone opens the site it asks "Who are you?" with a list of names (plus "Add
  me" to type a new name). The choice is remembered in a cookie and can be changed from the
  header. This is used to put "you" first and to record who logged each drink (`logged_by`).
- The home screen shows everyone as a grid of big tappable tiles (name, colour dot, today's
  count). Tapping a tile opens the drink picker for that person; logging for yourself is one tap
  on your own tile, which sits first.
- After logging, show a toast "🍺 Pils 0.5 L for Sander · Undo". Undo works for 2 minutes for
  anyone; after that only the admin can delete or edit an entry.
- Each player gets a stable colour (like `playerColorMap` in PokerHub) used everywhere.
- Admin (one shared `ADMIN_PASSWORD`, same cookie approach as PokerHub): rename, merge or remove
  players, edit or delete any drink, change a drink's time, edit the drink menu.
- Basic abuse guard: honeypot field and a rate limit of one log per person per 10 seconds, so a
  double tap doesn't count twice.

## Drinks and points

Alcoholic drinks only (no water or soft drinks). Every drink has a volume in ml and an ABV.
Points are **standard drinks**: 1 standard drink = 10 g pure alcohol, and
`grams = ml × ABV/100 × 0.789`. Store the ml and ABV on each logged drink (copied from the menu
at log time, so editing the menu never changes history) and compute points from them. Show
points with one decimal.

Seed menu (admin can add, edit, hide). The picker shows icon, name, size and % on big buttons,
grouped by category:

| Category | Drink | ml | ABV | ≈ points |
|---|---|---|---|---|
| Beer | Pils (small) | 330 | 4.8% | 1.3 |
| Beer | Pils (Halbe) | 500 | 4.8% | 1.9 |
| Beer | Weizen | 500 | 5.4% | 2.1 |
| Beer | Radler | 500 | 2.5% | 1.0 |
| Beer | Strong beer / Bock | 330 | 7.5% | 2.0 |
| Wine | Glass of wine | 150 | 12% | 1.4 |
| Wine | Sekt / Prosecco | 100 | 11% | 0.9 |
| Mixed | Aperol Spritz | 200 | 11% | 1.7 |
| Mixed | Long drink (vodka/rum/gin mix) | 250 | 6.4% | 1.3 |
| Mixed | Cocktail | 200 | 12% | 1.9 |
| Mixed | Hard seltzer / Alcopop | 330 | 5% | 1.3 |
| Shots | Shot (2 cl, 40%) | 20 | 40% | 0.6 |
| Shots | Jägermeister | 20 | 35% | 0.6 |
| Shots | Double shot (4 cl) | 40 | 40% | 1.3 |

Plus **Custom**: enter name, ml and % (quick ml chips 20 / 40 / 200 / 330 / 500 and a % field).
Custom drinks are logged as-is and don't get added to the menu.

## Screens

Same shell as PokerHub: `SiteHeader`, phone-only `BottomNav` (Home, Leaderboard, People,
Achievements), desktop layout that still looks good. Pages must not scroll sideways at 360px.

1. **Home (`/`)**
   - Header strip: "Sticky Dortmund", a live clock of the trip (e.g. "Day 1 · 23:14") and
     group totals (drinks, points, current hour's points).
   - The people grid with big tiles for logging (see above).
   - **This hour** leaderboard (top 5, link to the full one) with a countdown to the end of the
     hour.
   - Below that, a chart of points per hour for the whole group, stacked or one line per person
     (Recharts, coloured by player), over the trip so far.
   - A "Latest" feed: the last 10 drinks with who logged it and an undo button while allowed.
2. **Leaderboard (`/leaderboard`)** — the leaderboard is **per hour**:
   - A horizontal, scrollable strip of hour chips for the whole trip ("Fri 20:00", "Fri 21:00",
     …), defaulting to the current hour. Picking one shows the ranking for that hour (points, drink
     count, top drink icon).
   - Each past hour shows its **Hour Champion** with a crown. A "Hall of Hours" list counts how
     many hours each person won.
   - Tabs above the strip for **Hour** (default), **Day** (days run 06:00 to 06:00, so a night
     out counts as one day) and **Weekend** totals.
   - Ties share the rank.
3. **People (`/people`, `/people/[slug]`)** — like PokerHub's player pages: hero card with
   totals and fun stats, achievement showcase, their points-per-hour chart, and a full drink log
   (editable by admin).
4. **Achievements (`/achievements`)** — same UI as PokerHub (filter, sort, rarity, who earned
   it, hidden ones show ???).
5. **Admin (`/admin`)** — sign in, players, drink menu, all drinks.

Everything updates live: refresh data every 15 seconds and right after a log (server actions
plus `router.refresh()`; no websockets needed).

## Fun stats

Show these on the home page (group) and on each person's page, PokerHub-style KPI cards:

- Total drinks, total points, and **pure alcohol in ml** ("you've had 312 ml of pure alcohol").
- **Beer equivalent**: total points expressed as Pils 0.5 L.
- **Pace**: points per hour since their first drink of the day, and their best single hour.
- **Favourite drink** and drink mix (small bar of categories).
- **Longest streak**: most consecutive hours with at least one drink.
- **First drink of the day** ("Early Bird") and **last drink of the night** ("Last One Standing")
  per day, with the time.
- **Biggest hour** of the weekend (person and hour) and the group's busiest hour.
- **Liquid volume**: total litres drunk ("2.4 L, that's a big bottle of cola").
- **Longest dry spell** during the day, between 12:00 and 02:00.
- Group: drinks per category pie, who logs the most for other people ("Waiter of the Weekend"),
  and the share of the group total per person.

### Alcohol still in your system

A live estimate of how much alcohol each person still has to process, shown as a big KPI on
their tile, their page and a group "Still in the system" ranking on the home page.

- Model: every logged drink adds its grams of pure alcohol at `consumed_at`; the body removes
  alcohol at a steady rate until the total reaches zero (it never goes below zero and doesn't
  "bank" time before a drink). Simulate this in time order over each person's drinks.
- Rate: a fixed **7 g of alcohol per hour** (about 0.7 points/hour) for everyone, as a
  constant in `src/lib/metabolism.ts`. No body weight or other personal data.
- Show it in grams and as points ("still processing 3.4 drinks"), plus a small sparkline/area
  chart of the curve over the last 12 hours and the person's **peak** of the weekend.
- Recompute on every refresh so it visibly ticks down; put the pure function in
  `src/lib/metabolism.ts` with vitest tests (single drink decays to 0, overlapping drinks stack,
  never negative).
- Fun stats from it: "Peak load" of the weekend (person and time), and who processed the most
  alcohol in total.
- Under the number, always show a small line: "Rough estimate for fun. Not a sobriety or
  driving check." Do **not** show a blood-alcohol / promille value or a "sober at" or "safe to
  drive" time.

## Achievements

Same engine idea as PokerHub (`src/achievements/definitions.ts` with `id`, `name`,
`description`, `icon`, optional `hidden`, `check`, optional `progress`), but the context is
built per drink in time order instead of per session, so unlocks get a timestamp and apply
retroactively. Show a confetti toast when someone unlocks one while you're on the page. Start
with:

| Name | Icon | Rule |
|---|---|---|
| First Round | 🍺 | Log your first drink. |
| Prost! | 🍻 | Drink at the same minute as 3 or more others (within 2 minutes). |
| Hour Champion | 👑 | Win an hour on the leaderboard. |
| Hat Trick | 🎩 | Win 3 hours. |
| Dynasty | 🏰 | Win 3 hours in a row. |
| Halbe Hero | 🥨 | 5 Pils Halbe in total. |
| Dortmund Local | 🟡 | 10 beers in total. |
| Shot Caller | 🎯 | 3 shots in one hour. |
| Wine Mom | 🍷 | 4 glasses of wine in one day. |
| Spritz o'Clock | 🍊 | Drink an Aperol Spritz before 17:00. |
| Connoisseur | 🧐 | Try 6 different drinks from the menu. |
| Mad Scientist | 🧪 | Log a custom drink. |
| Early Bird | 🌅 | First drink of the whole group on a day. |
| Breakfast of Champions | 🥞 | A drink between 06:00 and 11:00. |
| Last One Standing | 🦉 | Last drink of the group on a night (after 02:00). |
| Marathon | 🏃 | A drink in 6 consecutive hours. |
| Century | 💯 | 100 points as a group (everyone who drank that day gets it). |
| Steady Eddie | 🐢 | At least 1 drink in every hour from 20:00 to 01:00 on one night. |
| Comeback Kid | 🔁 | Win an hour after 3 hours with no drinks. |
| Waiter | 🧑‍🍳 | Log 10 drinks for other people. |
| Liter Club | 🪣 | Drink 5 litres in total over the weekend. |
| All-Rounder | 🎨 | A beer, a wine, a mixed drink and a shot in one day. |
| Sticky Fingers (hidden) | 🍯 | Have a drink undone 3 times. |
| Weekend Warrior | 🗓️ | Drink on all three days of the trip. |
| Collector | 🏆 | Unlock 10 other achievements. |

## Data model (Drizzle)

- `players`: id, name (unique), slug, colour index, created_at.
- `drink_types`: id, name, category, icon, ml, abv (numeric), sort order, hidden.
- `drinks`: id, player_id, drink_type_id (null for custom), name, category, ml, abv, consumed_at
  (timestamptz, defaults to now), logged_by_player_id (nullable), created_at, deleted_at
  (soft delete so undo counts for Sticky Fingers).
- Index `drinks (consumed_at)` and `drinks (player_id, consumed_at)`.
- Stats and achievements are recalculated from `drinks` on each request (like PokerHub's
  `getHub()`); the weekend is small enough that this is fine.

## Look and feel

Reuse PokerHub's component structure, KPI cards, badges and mobile rules, but swap the green
felt palette for a **beer hall / Dortmund** theme: deep dark background, amber/golden beer
yellow as the accent, foam white for text, black-and-yellow touches. Define the colours as
Tailwind theme tokens in `globals.css` like PokerHub does. Large touch targets (at least 56px)
because people will use this a few drinks in. The logging flow must take at most two taps.

## Done when

- `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` pass; add vitest tests for
  the points formula, hour/day bucketing in Europe/Berlin (including the 06:00 day cut-off) and
  the achievement engine.
- Screenshots at 390px and 1440px look right.
- A README explains local setup and the Vercel + Neon deploy steps (copy PokerHub's).
- Seed script for the drink menu runs as part of migrations so a fresh deploy has the menu.
