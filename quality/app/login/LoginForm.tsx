"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ labels }: { labels: Record<"username" | "password" | "signIn" | "loginError", string> }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const field = "w-full border border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20";
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-semibold text-brand-900">
        {labels.username}
        <input name="username" required autoComplete="username" dir="ltr" className={field} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-brand-900">
        {labels.password}
        <input name="password" type="password" required autoComplete="current-password" dir="ltr" className={field} />
      </label>
      {state.error && <p role="alert" className="bg-red-50 px-3 py-2 text-sm text-red-700">{labels.loginError}</p>}
      <button disabled={pending} className="mt-2 bg-brand-900 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
        {pending ? "…" : labels.signIn}
      </button>
    </form>
  );
}
