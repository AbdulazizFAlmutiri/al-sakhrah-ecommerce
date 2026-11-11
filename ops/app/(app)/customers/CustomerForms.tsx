"use client";
import { useActionState } from "react";
import { addBranchAction, addCustomerAction } from "./actions";
import type { ActionState } from "../admin/users/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";

type Labels = Record<"customerName" | "addCustomer" | "customer" | "branchName" | "phone" | "location" | "addBranch" | "saved" | "choose", string> & {
  errors: Record<string, string>;
};

export function AddCustomerForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addCustomerAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="w-72"><Field label={labels.customerName} name="name" required /></div>
      <Button type="submit" disabled={pending}>{labels.addCustomer}</Button>
      <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
      <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
    </form>
  );
}

export function AddBranchForm({ customers, labels, returnTo, defaultCustomer }: {
  customers: { id: string; name: string }[]; labels: Labels; returnTo?: string; defaultCustomer?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addBranchAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {returnTo && <input type="hidden" name="return" value={returnTo} />}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.customer}</span>
        <select name="customer_id" required defaultValue={defaultCustomer ?? ""} className="h-11 border border-mist-300 bg-white px-2">
          <option value="" disabled>{labels.choose}</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <Field label={labels.branchName} name="name" required />
      <Field label={labels.phone} name="phone" dir="ltr" inputMode="tel" />
      <Field label={labels.location} name="location" dir="ltr" placeholder="https://maps.app.goo.gl/…  /  24.71, 46.67" required />
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={pending}>{labels.addBranch}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
      </div>
    </form>
  );
}
