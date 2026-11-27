# Drinkhub · Sticky Dortmund

Drink counter for our weekend away in Dortmund (Friday 27 to Sunday 29 November 2026).
Anyone can log a drink for anyone in two taps; the site turns that into an hourly
leaderboard (Hour Champions), fun stats, a rough "still in the system" estimate and
Steam-style achievements. The admin (one shared password) can fix players, drinks and the menu.

Built with Next.js 16 (App Router), TypeScript, Tailwind 4, Drizzle ORM on Postgres, and
Recharts, the same stack as PokerHub. Hosted on Vercel with a Neon Postgres database. All
times are Europe/Berlin; days run from 06:00 to 06:00. The full spec is in
[BUILD_PROMPT.md](BUILD_PROMPT.md).

## Running locally

You need Node 20+ and a Postgres database (a local one, or a free Neon branch).

```bash
npm install
cp .env.example .env        # set DATABASE_URL and ADMIN_PASSWORD
npm run db:migrate          # creates the tables and the drink menu (also runs on every build)
npm run dev
```

Open http://localhost:3000, pick "Add me" and log a drink.

Checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Deploying to Vercel

1. Import this repository as a new Vercel project.
2. In the project, open **Storage → Marketplace → Neon** and create a free database. This
   sets `DATABASE_URL` for you.
3. Add `ADMIN_PASSWORD` under **Settings → Environment Variables**.
4. Redeploy (Deployments → ⋯ → Redeploy). Every build first creates or updates the
   database tables and seeds the drink menu (`scripts/migrate.mjs`), so there is no manual
   migration step. Environment variable changes only take effect after a redeploy.

## Points and the alcohol estimate

- 1 point = 1 standard drink = 10 g of pure alcohol; `grams = ml × ABV/100 × 0.789`
  (`src/lib/drinks.ts`). Each logged drink stores its own ml and ABV, so editing the menu
  never changes history.
- "Still in the system" (`src/lib/metabolism.ts`): each drink adds its grams, and a fixed
  7 g per hour is processed until it reaches zero. It's a rough estimate for fun, not a
  sobriety or driving check.

## Adding an achievement

Achievements live in [`src/achievements/definitions.ts`](src/achievements/definitions.ts):
an `id` (unique and stable), `name`, `description`, `icon` (an emoji), optional `hidden`,
a `check(c)` and an optional `progress(c)`. The engine replays every drink in time order,
so the first moment `check` passes becomes the unlock time and new or edited achievements
apply retroactively. The context fields are documented in
[`src/achievements/types.ts`](src/achievements/types.ts).

## Project layout

- `src/lib/data.ts` – `getHub()`: loads players, menu and drinks once per request
- `src/lib/time.ts`, `hours.ts` – Europe/Berlin hour and day buckets
- `src/lib/leaderboard.ts`, `stats.ts`, `metabolism.ts` – pure, tested calculations
- `src/achievements/` – definitions and the replay engine
- `src/app/` – pages: home, `leaderboard`, `people/[slug]`, `achievements`, `admin`
- `src/db/schema.ts` – tables: players, drink_types, drinks; migrations in `drizzle/`
