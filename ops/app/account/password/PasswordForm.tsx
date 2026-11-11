"use client";
import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import type { MessageKey } from "@/lib/i18n";

export function PasswordForm({ labels }: { labels: { new: string; confirm: string; submit: string; errors: Partial<Record<MessageKey, string>> } }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={labels.new} name="password" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
      <Field label={labels.confirm} name="confirm" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
      <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
      <Button type="submit" size="lg" disabled={pending}>{labels.submit}</Button>
    </form>
  );
}
