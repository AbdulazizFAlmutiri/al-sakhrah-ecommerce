"use client";
import { useActionState } from "react";
import { saveReasonAction } from "./actions";
import type { ActionState } from "../users/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";

type Reason = { id: string; code: string; label_ar: string; label_en: string; label_ur: string; icon: string; sort: number; active: boolean };
type Labels = { code: string; ar: string; en: string; ur: string; icon: string; sort: string; active: string; save: string; add: string; saved: string; errors: Record<string, string> };

function ReasonForm({ r, labels }: { r?: Reason; labels: Labels }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveReasonAction, {});
  const input = "h-9 w-full min-w-0 border border-mist-300 px-2 text-sm";
  return (
    <form action={action} className="grid items-center gap-2 border-b border-mist-200 py-3 grid-cols-2 lg:grid-cols-[32px_repeat(5,minmax(0,1fr))_64px_auto_auto]">
      {r && <input type="hidden" name="id" value={r.id} />}
      <Icon name={r?.icon ?? "add"} className="col-span-2 text-2xl text-royal-600 lg:col-span-1" />
      <input name="code" defaultValue={r?.code} aria-label={labels.code} placeholder={labels.code} dir="ltr" className={input} required />
      <input name="label_ar" defaultValue={r?.label_ar} aria-label={labels.ar} placeholder={labels.ar} dir="rtl" className={input} required />
      <input name="label_en" defaultValue={r?.label_en} aria-label={labels.en} placeholder={labels.en} dir="ltr" className={input} required />
      <input name="label_ur" defaultValue={r?.label_ur} aria-label={labels.ur} placeholder={labels.ur} dir="rtl" className={input} required />
      <input name="icon" defaultValue={r?.icon} aria-label={labels.icon} placeholder={labels.icon} dir="ltr" className={input} required />
      <input name="sort" type="number" defaultValue={r?.sort ?? 0} aria-label={labels.sort} className={input} />
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={r?.active ?? true} />{labels.active}</label>
      <div className="col-span-2 flex items-center gap-2 lg:col-span-1">
        <Button type="submit" variant={r ? "secondary" : "primary"} disabled={pending}>{r ? labels.save : labels.add}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
      </div>
    </form>
  );
}

export function ReasonsSection({ reasons, labels }: { reasons: Reason[]; labels: Labels }) {
  return (
    <div>
      {reasons.map((r) => <ReasonForm key={r.id} r={r} labels={labels} />)}
      <ReasonForm labels={labels} />
    </div>
  );
}
