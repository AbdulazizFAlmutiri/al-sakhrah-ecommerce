"use client";
import { useActionState } from "react";
import { cancelFailedAction, rescheduleAction } from "./actions";
import type { ActionState } from "../../admin/users/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

export function FailedActions({ id, defaultDate, drivers, labels }: {
  id: string; defaultDate: string; drivers: { user_id: string; full_name: string }[];
  labels: Record<"reschedule" | "cancel" | "date" | "driver" | "external" | "note" | "choose", string> & { errors: Record<string, string> };
}) {
  const [rs, rsAction, rsPending] = useActionState<ActionState, FormData>(rescheduleAction, {});
  const [cs, csAction, csPending] = useActionState<ActionState, FormData>(cancelFailedAction, {});
  return (
    <div className="flex flex-col gap-3">
      <form action={rsAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="flex flex-col gap-1 text-xs">{labels.date}
          <input type="date" name="delivery_date" defaultValue={defaultDate} required dir="ltr" className="h-9 border border-mist-200 px-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs">{labels.driver}
          <select name="driver" required defaultValue="" className="h-9 border border-mist-200 bg-white px-2 text-sm">
            <option value="" disabled>{labels.choose}</option>
            {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.full_name}</option>)}
            <option value="external">{labels.external}</option>
          </select>
        </label>
        <Button type="submit" disabled={rsPending} className="!h-9">{labels.reschedule}</Button>
      </form>
      <form action={csAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input name="note" placeholder={labels.note} className="h-9 border border-mist-200 px-2 text-sm" />
        <Button type="submit" variant="ghost" disabled={csPending} className="!h-9 text-bad-600">{labels.cancel}</Button>
      </form>
      <FormMessage kind="error">{(rs.error && labels.errors[rs.error]) || (cs.error && labels.errors[cs.error]) || null}</FormMessage>
    </div>
  );
}
