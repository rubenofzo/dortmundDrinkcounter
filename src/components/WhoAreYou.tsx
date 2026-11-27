"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addMe, pickMe } from "@/app/actions";
import { DialogClose } from "./ui";

type Person = { id: number; name: string; color: string };

/** "Who are you?" bottom sheet. Cannot be dismissed on a first visit (`dismissable` false). */
export function WhoAreYou({ players, dismissable }: { players: Person[]; dismissable: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  function done() {
    ref.current?.close();
    router.replace("/");
    router.refresh();
  }
  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.ok) done();
      else setError(r.error ?? "Something went wrong");
    });
  }

  return (
    <dialog
      ref={ref}
      aria-label="Who are you?"
      onCancel={(e) => !dismissable && e.preventDefault()}
      onClose={() => dismissable && router.replace("/")}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none rounded-t-[22px] bg-foam p-0 text-ink md:inset-0 md:m-auto md:h-fit md:w-[min(520px,calc(100vw-32px))] md:rounded-[20px]"
    >
      <div className="flex max-h-[90dvh] flex-col overflow-y-auto px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] md:p-6">
        <div className="flex items-center gap-3">
          <h2 className="flex-1 font-display text-[28px] uppercase">Who are you?</h2>
          {dismissable && <DialogClose onClick={() => ref.current?.close()} />}
        </div>
        <p className="mt-1 text-sm text-ink-muted">Tap your name. This phone will remember it.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => run(() => pickMe(p.id))}
              className="flex min-h-14 items-center gap-2.5 rounded-xl border border-foam-line bg-white/60 px-3.5 text-left text-base font-bold active:bg-accent active:text-foam"
            >
              <span aria-hidden className="h-3 w-3 flex-none rounded-full ring-1 ring-ink/40" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
        <form
          className="mt-4 flex flex-col gap-2 border-t border-foam-line pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addMe(name));
          }}
        >
          <label htmlFor="add-me" className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
            Not in the list? Add me
          </label>
          <div className="flex gap-2">
            <input
              id="add-me"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="Your name"
              autoComplete="off"
              className="min-h-14 min-w-0 flex-1 rounded-xl border border-foam-line bg-white px-3.5 text-base"
            />
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="min-h-14 rounded-xl bg-accent px-5 font-display text-lg text-foam uppercase disabled:opacity-50"
            >
              Add me
            </button>
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-accent-dark">{error}</p>}
        </form>
      </div>
    </dialog>
  );
}
