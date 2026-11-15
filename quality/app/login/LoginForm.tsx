"use client";
import { useActionState } from "react";
import { ArrowLeft, Loader2, Lock, User } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ labels }: { labels: Record<"username" | "password" | "signIn" | "loginError", string> }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const field = "w-full border border-ink/15 bg-white py-3 ps-11 pe-4 outline-none transition-shadow focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15";
  const icon = "pointer-events-none absolute top-1/2 start-3.5 -translate-y-1/2 text-ink/35";
  return (
    <form action={action} className="grid gap-5">
      <label className="grid gap-1.5 text-sm font-semibold text-brand-900">
        {labels.username}
        <span className="relative">
          <User size={18} className={icon} />
          <input name="username" required autoComplete="username" dir="ltr" className={field} />
        </span>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-brand-900">
        {labels.password}
        <span className="relative">
          <Lock size={18} className={icon} />
          <input name="password" type="password" required autoComplete="current-password" dir="ltr" className={field} />
        </span>
      </label>
      {state.error && <p role="alert" className="border-s-4 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-700">{labels.loginError}</p>}
      <button disabled={pending} className="mt-1 inline-flex items-center justify-center gap-2 bg-brand-900 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-900/20 transition-colors hover:bg-brand-700 disabled:opacity-60">
        {pending ? <Loader2 size={18} className="animate-spin" /> : <>{labels.signIn} <ArrowLeft size={18} className="ltr:rotate-180" /></>}
      </button>
    </form>
  );
}
