"use client";

import { useState } from "react";

/** Folded extra content with a quiet "Show all" toggle underneath, so long lists stay short on phones. */
export function ShowMore({
  children,
  label,
  less = "Show less",
  tone = "hall",
}: {
  children: React.ReactNode;
  label: string;
  less?: string;
  tone?: "hall" | "card";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && children}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[14px] font-bold ${
          tone === "card" ? "text-accent-dark hover:bg-foam-line/60" : "text-accent-light hover:bg-hall-light"
        }`}
      >
        {open ? less : label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden className={open ? "rotate-180" : undefined}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </>
  );
}
