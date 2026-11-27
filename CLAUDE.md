@AGENTS.md

# Drinkhub

Drink counter for the Sticky Dortmund weekend. Spec: `BUILD_PROMPT.md`; setup and layout: `README.md`.
Same stack and conventions as PokerHub (Next.js 16, Tailwind 4, Drizzle on Neon, Recharts). Everything is
derived from `getHub()` in `src/lib/data.ts` on each request. Times are Europe/Berlin; days run 06:00 to 06:00.
Phone first: bare classes are the phone layout, `md:` is desktop. Signature colour is red (`accent`).

Before committing: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
