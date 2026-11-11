import "server-only";
import { createClient } from "@/lib/db/server";
import type { BranchOption } from "@/lib/customers/branchSearch";
import type { OrderStatus } from "@/lib/orders/status";

const ORDER_COLS =
  "id, status, external, driver_id, po_number, notes, delivery_date, status_changed_at, ready_at, stop_seq, eta, branch:branches(name, customer:customers(name)), rep:sales_reps(name)";

export type BoardOrder = {
  id: string;
  status: OrderStatus;
  external: boolean;
  driver_id: string | null;
  po_number: string;
  notes: string | null;
  delivery_date: string;
  status_changed_at: string;
  ready_at: string | null;
  stop_seq: number | null;
  eta: string | null;
  branch: { name: string; customer: { name: string } | null } | null;
  rep: { name: string } | null;
};

export async function getOrdersForDate(date: string): Promise<BoardOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLS)
    .eq("delivery_date", date)
    .neq("status", "cancelled")
    .order("created_at");
  return (data ?? []) as unknown as BoardOrder[];
}

export type FailedOrder = BoardOrder & { failed_at: string; reason_id: string | null; note: string | null };

export async function getFailedOrders(): Promise<FailedOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(ORDER_COLS).eq("status", "failed").order("status_changed_at");
  const orders = (data ?? []) as unknown as BoardOrder[];
  if (orders.length === 0) return [];
  const { data: events } = await supabase
    .from("order_events")
    .select("order_id, meta, created_at")
    .eq("to_status", "failed")
    .in("order_id", orders.map((o) => o.id))
    .order("created_at", { ascending: false });
  const latest = new Map<string, { meta: Record<string, unknown>; created_at: string }>();
  for (const e of events ?? []) if (!latest.has(e.order_id)) latest.set(e.order_id, { meta: (e.meta ?? {}) as Record<string, unknown>, created_at: e.created_at });
  return orders.map((o) => {
    const ev = latest.get(o.id);
    return {
      ...o,
      failed_at: ev?.created_at ?? o.status_changed_at,
      reason_id: typeof ev?.meta.reason_id === "string" ? ev.meta.reason_id : null,
      note: typeof ev?.meta.note === "string" ? ev.meta.note : null,
    };
  });
}

export async function getActiveDrivers() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("user_id, full_name").eq("role", "driver").eq("active", true).order("full_name");
  return data ?? [];
}

export async function getReasons() {
  const supabase = await createClient();
  const { data } = await supabase.from("failure_reasons").select("id, code, icon, label_ar, label_en, label_ur").eq("active", true).order("sort");
  return data ?? [];
}

export async function getFormOptions() {
  const supabase = await createClient();
  const [{ data: branches }, { data: reps }, drivers] = await Promise.all([
    supabase.from("branches").select("id, name, customer:customers(name)").order("name"),
    supabase.from("sales_reps").select("id, name").eq("active", true).order("name"),
    getActiveDrivers(),
  ]);
  const options: BranchOption[] = ((branches ?? []) as unknown as { id: string; name: string; customer: { name: string } | null }[])
    .map((b) => ({ id: b.id, name: b.name, customer: b.customer?.name ?? "" }))
    .sort((a, b) => a.customer.localeCompare(b.customer, "ar") || a.name.localeCompare(b.name, "ar"));
  return { branches: options, reps: reps ?? [], drivers };
}
