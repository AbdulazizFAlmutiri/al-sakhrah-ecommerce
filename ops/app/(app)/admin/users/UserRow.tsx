"use client";
import { useActionState } from "react";
import { resetPasswordAction, updateUserAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import type { UserFormLabels } from "./CreateUserForm";

export type UserRowData = { user_id: string; username: string; full_name: string; role: string; locale: string; active: boolean };

export function UserRow({ u, labels }: { u: UserRowData; labels: UserFormLabels & { save: string; active: string; reset: string; resetDone: string; saved: string } }) {
  const [upd, updAction, updPending] = useActionState<ActionState, FormData>(updateUserAction, {});
  const [rst, rstAction, rstPending] = useActionState<ActionState, FormData>(resetPasswordAction, {});
  return (
    <li className="flex flex-col gap-3 border-b border-mist-200 py-4">
      <form action={updAction} className="grid gap-3 md:grid-cols-6 md:items-center">
        <input type="hidden" name="user_id" value={u.user_id} />
        <span dir="ltr" className="font-mono text-sm text-ink-700">{u.username}</span>
        <input name="full_name" defaultValue={u.full_name} className="h-10 border border-mist-200 px-2" aria-label={labels.fullName} />
        <select name="role" defaultValue={u.role} className="h-10 border border-mist-200 bg-white px-2" aria-label={labels.role}>
          {Object.entries(labels.roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="locale" defaultValue={u.locale} className="h-10 border border-mist-200 bg-white px-2" aria-label={labels.locale}>
          {Object.entries(labels.locales).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={u.active} /> {labels.active}
        </label>
        <Button type="submit" variant="secondary" disabled={updPending}>{labels.save}</Button>
      </form>
      <form action={rstAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="user_id" value={u.user_id} />
        <input name="password" dir="ltr" minLength={8} required placeholder={labels.password}
          className="h-9 w-56 border border-mist-200 px-2 text-sm" aria-label={labels.password} />
        <Button type="submit" variant="ghost" disabled={rstPending}>{labels.reset}</Button>
        <FormMessage kind="error">{(upd.error && labels.errors[upd.error]) || (rst.error && labels.errors[rst.error]) || null}</FormMessage>
        <FormMessage kind="success">{rst.ok ? labels.resetDone : upd.ok ? labels.saved : null}</FormMessage>
      </form>
    </li>
  );
}
