"use client";
import { useActionState } from "react";
import { createUserAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import type { MessageKey } from "@/lib/i18n";

export type UserFormLabels = {
  username: string; fullName: string; role: string; locale: string; password: string; submit: string; created: string;
  roles: Record<string, string>; locales: Record<string, string>; errors: Partial<Record<MessageKey, string>>;
};

export function CreateUserForm({ labels }: { labels: UserFormLabels }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createUserAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-5 md:items-end">
      <Field label={labels.username} name="username" dir="ltr" autoCapitalize="none" required />
      <Field label={labels.fullName} name="full_name" required />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.role}</span>
        <select name="role" className="h-11 border border-mist-200 bg-white px-2" defaultValue="driver">
          {Object.entries(labels.roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.locale}</span>
        <select name="locale" className="h-11 border border-mist-200 bg-white px-2" defaultValue="ar">
          {Object.entries(labels.locales).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <Field label={labels.password} name="password" dir="ltr" minLength={8} required />
      <div className="md:col-span-5 flex items-center gap-4">
        <Button type="submit" disabled={pending}>{labels.submit}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.created : null}</FormMessage>
      </div>
    </form>
  );
}
