/**
 * Shown the moment someone taps a link, while the next page renders on the server (every page
 * is computed per request), so a tap never looks like nothing happened.
 */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4 md:gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 rounded-lg bg-hall-light/70" />
      <div className="h-44 rounded-2xl bg-foam/15" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-20 rounded-xl bg-hall-light/60" />
        <div className="h-20 rounded-xl bg-hall-light/60" />
        <div className="h-20 rounded-xl bg-hall-light/60" />
      </div>
      <div className="h-56 rounded-2xl bg-hall-light/50" />
    </div>
  );
}
