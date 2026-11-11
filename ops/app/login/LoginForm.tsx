"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import type { MessageKey } from "@/lib/i18n";

export function LoginForm({ labels }: { labels: Record<"username" | "password" | "submit", string> & { errors: Partial<Record<MessageKey, string>> } }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={labels.username} name="username" autoComplete="username" autoCapitalize="none" dir="ltr" required />
      <Field label={labels.password} name="password" type="password" autoComplete="current-password" dir="ltr" required />
      <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
      <Button type="submit" size="lg" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
