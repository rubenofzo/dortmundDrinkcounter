"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4 text-ink">
      <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-muted">
        Admin password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="min-h-12 rounded-lg border border-foam-line bg-white px-3 text-base text-ink focus:border-accent-dark focus:outline-none"
        />
      </label>
      {state.error && <p className="text-sm font-semibold text-chip-dark">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-14 rounded-full bg-accent px-7 font-bold text-white hover:bg-accent-light disabled:opacity-50"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
