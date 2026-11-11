"use client";
import { useActionState } from "react";
import { addRepAction, toggleRepAction } from "./actions";
import type { ActionState } from "../users/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";

export function RepsSection({ reps, labels }: {
  reps: { id: string; name: string; active: boolean }[];
  labels: { name: string; add: string; active: string; inactive: string; error?: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addRepAction, {});
  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="w-64"><Field label={labels.name} name="name" required /></div>
        <Button type="submit" disabled={pending}>{labels.add}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
      </form>
      <ul className="flex flex-wrap gap-2">
        {reps.map((r) => (
          <li key={r.id}>
            <form action={toggleRepAction}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="active" value={String(!r.active)} />
              <button className={`border px-3 py-1 text-sm ${r.active ? "border-royal-600 text-navy-700" : "border-mist-300 text-ink-500 line-through"}`}
                title={r.active ? labels.active : labels.inactive}>
                {r.name}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
