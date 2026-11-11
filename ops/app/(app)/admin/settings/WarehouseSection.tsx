"use client";
import { useActionState } from "react";
import { saveWarehouseAction } from "./actions";
import type { ActionState } from "../users/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";

export function WarehouseSection({ w, labels }: {
  w: { id: string; name: string; lat: number | null; lng: number | null };
  labels: { name: string; link: string; save: string; saved: string; location: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveWarehouseAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
      <input type="hidden" name="id" value={w.id} />
      <Field label={labels.name} name="name" defaultValue={w.name} required />
      <Field label={labels.link} name="location" dir="ltr" placeholder="https://maps.app.goo.gl/…" />
      <Button type="submit" disabled={pending}>{labels.save}</Button>
      <p className="text-sm text-ink-500 md:col-span-3" dir="auto">{labels.location}</p>
      <div className="md:col-span-3">
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
      </div>
    </form>
  );
}
