"use client";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createOrderAction, type OrderState } from "./actions";
import { matchBranches, type BranchOption } from "@/lib/customers/branchSearch";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";

type Labels = Record<
  "branch" | "search" | "missing" | "addBranch" | "rep" | "po" | "driver" | "external" | "date" | "notes" | "save" | "another" | "saved" | "choose",
  string
> & { errors: Record<string, string> };

export function OrderForm(props: {
  branches: BranchOption[]; reps: { id: string; name: string }[]; drivers: { user_id: string; full_name: string }[];
  today: string; initialBranch?: string; labels: Labels;
}) {
  const [state, action, pending] = useActionState<OrderState, FormData>(createOrderAction, {});
  // Remount (clear) the fields after each "save & add another".
  return <Fields key={state.savedAt ?? 0} {...props} state={state} action={action} pending={pending} />;
}

function Fields({ branches, reps, drivers, today, initialBranch, labels, state, action, pending }: Parameters<typeof OrderForm>[0] & {
  state: OrderState; action: (fd: FormData) => void; pending: boolean;
}) {
  const initial = branches.find((b) => b.id === initialBranch) ?? null;
  const [picked, setPicked] = useState<BranchOption | null>(state.savedAt ? null : initial);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => matchBranches(q, branches), [q, branches]);
  const select = "h-11 border border-mist-200 bg-white px-2 text-base";

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="relative md:col-span-2">
        <span className="mb-1 block text-sm font-semibold text-ink-700">{labels.branch}</span>
        <input type="hidden" name="branch_id" value={picked?.id ?? ""} />
        {picked ? (
          <div className="flex h-11 items-center justify-between rounded-xl border border-royal-500 bg-royal-50 px-3">
            <span className="font-bold text-navy-700">{picked.customer} — {picked.name}</span>
            <button type="button" onClick={() => { setPicked(null); setQ(""); }} className="text-ink-500" aria-label="clear">
              <Icon name="close" />
            </button>
          </div>
        ) : (
          <input
            autoFocus value={q} placeholder={labels.search} role="combobox" aria-expanded={open} aria-controls="branch-list"
            onChange={(e) => { setQ(e.target.value); setOpen(e.target.value.trim().length > 0); }}
            className="h-11 w-full border border-mist-200 bg-white px-3 text-base outline-none focus:border-royal-600 focus:ring-2 focus:ring-royal-100"
          />
        )}
        {!picked && open && (
          <ul id="branch-list" role="listbox" className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-mist-200 bg-white shadow-lg">
            {results.map((b) => (
              <li key={b.id} role="option" aria-selected={false}>
                <button type="button" onClick={() => { setPicked(b); setOpen(false); }} className="w-full px-3 py-2 text-start hover:bg-royal-50">
                  <span className="font-bold">{b.customer}</span> — {b.name}
                </button>
              </li>
            ))}
            <li className="border-t border-mist-200">
              <Link href="/customers?return=/board/new" className="flex items-center gap-2 px-3 py-2 text-sm text-royal-600">
                <Icon name="add_location_alt" />{labels.missing} {labels.addBranch}
              </Link>
            </li>
          </ul>
        )}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.rep}</span>
        <select name="sales_rep_id" required defaultValue="" className={select}>
          <option value="" disabled>{labels.choose}</option>
          {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>
      <Field label={labels.po} name="po_number" dir="ltr" required autoComplete="off" />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.driver}</span>
        <select name="driver" required defaultValue="" className={select}>
          <option value="" disabled>{labels.choose}</option>
          {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.full_name}</option>)}
          <option value="external">{labels.external}</option>
        </select>
      </label>
      <Field label={labels.date} name="delivery_date" type="date" defaultValue={today} dir="ltr" required />
      <label className="flex flex-col gap-1 text-sm md:col-span-2">
        <span className="font-semibold text-ink-700">{labels.notes}</span>
        <textarea name="notes" rows={2} className="border border-mist-200 bg-white px-3 py-2 text-base" />
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button type="submit" name="intent" value="another" size="lg" disabled={pending}>
          <Icon name="add" />{labels.another}
        </Button>
        <Button type="submit" name="intent" value="save" size="lg" variant="secondary" disabled={pending}>{labels.save}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
      </div>
    </form>
  );
}
