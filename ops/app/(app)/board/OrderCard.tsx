"use client";
import { useActionState, useState } from "react";
import { cancelOrderAction, closeExternalAction } from "./actions";
import type { ActionState } from "../admin/users/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";

export type CardLabels = Record<"rep" | "po" | "cancel" | "delivered" | "failed" | "reason" | "note" | "confirm" | "choose", string> & {
  errors: Record<string, string>;
};

/** Client-side controls for one order (the server renders the chip, age and texts and passes them in). */
export function OrderCardActions({ id, status, external, reasons, labels }: {
  id: string; status: string; external: boolean;
  reasons: { id: string; label: string; icon: string }[]; labels: CardLabels;
}) {
  const [mode, setMode] = useState<"none" | "failed">("none");
  const [state, action, pending] = useActionState<ActionState, FormData>(closeExternalAction, {});
  const canCancel = status === "new" || status === "ready";
  const canClose = external && status === "ready";
  if (!canCancel && !canClose) return null;
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-mist-200 pt-3">
      <div className="flex flex-wrap gap-2">
        {canClose && (
          <form action={action}>
            <input type="hidden" name="id" value={id} /><input type="hidden" name="outcome" value="delivered" />
            <Button type="submit" variant="secondary" disabled={pending} className="!h-9 text-ok-600"><Icon name="check_circle" />{labels.delivered}</Button>
          </form>
        )}
        {canClose && (
          <Button type="button" variant="ghost" className="!h-9 text-bad-600" onClick={() => setMode(mode === "failed" ? "none" : "failed")}>
            <Icon name="cancel" />{labels.failed}
          </Button>
        )}
        {canCancel && (
          <form action={cancelOrderAction} onSubmit={(e) => { if (!confirm(labels.cancel + "?")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="ghost" className="!h-9 text-ink-500"><Icon name="block" />{labels.cancel}</Button>
          </form>
        )}
      </div>
      {mode === "failed" && (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="outcome" value="failed" />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={labels.reason}>
            {reasons.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-1 rounded-full border border-mist-200 px-3 py-1 text-sm has-[:checked]:border-bad-600 has-[:checked]:bg-bad-50">
                <input type="radio" name="reason_id" value={r.id} required className="sr-only" />
                <Icon name={r.icon} className="text-base" />{r.label}
              </label>
            ))}
          </div>
          <input name="note" placeholder={labels.note} className="h-9 border border-mist-200 px-2 text-sm" />
          <Button type="submit" variant="danger" disabled={pending} className="!h-9 self-start">{labels.confirm}</Button>
        </form>
      )}
      <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
    </div>
  );
}
