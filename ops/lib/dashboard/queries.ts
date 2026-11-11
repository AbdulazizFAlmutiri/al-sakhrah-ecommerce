import "server-only";
import { createClient } from "@/lib/db/server";
import { addDays, isIsoDate, riyadhToday } from "@/lib/time";
import type { DashOrder } from "./stats";

export type DashFilters = { from: string; to: string; driver: string; rep: string; customer: string; preset: string };

export function parseFilters(sp: Record<string, string | string[] | undefined>): DashFilters {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const today = riyadhToday();
  const preset = one("preset") || (one("from") ? "custom" : "today");
  let from = today, to = today;
  if (preset === "yesterday") from = to = addDays(today, -1);
  else if (preset === "week") from = addDays(today, -6);
  else if (preset === "month") from = addDays(today, -29);
  else if (preset === "custom") {
    from = isIsoDate(one("from")) ? one("from") : today;
    to = isIsoDate(one("to")) ? one("to") : from;
    if (to < from) [from, to] = [to, from];
  }
  return { from, to, preset, driver: one("driver"), rep: one("rep"), customer: one("customer") };
}

export function filtersToQuery(f: DashFilters, extra: Record<string, string> = {}): string {
  const p = new URLSearchParams();
  if (f.preset === "custom") { p.set("from", f.from); p.set("to", f.to); } else if (f.preset !== "today") p.set("preset", f.preset);
  for (const k of ["driver", "rep", "customer"] as const) if (f[k]) p.set(k, f[k]);
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

type Raw = {
  id: string; status: string; delivery_date: string; created_at: string; ready_at: string | null; delivered_at: string | null;
  external: boolean; po_number: string; trip_id: string | null; driver_id: string | null; sales_rep_id: string;
  driver: { full_name: string } | null; rep: { name: string } | null;
  branch: { name: string; customer_id: string; customer: { name: string } | null } | null;
};

export async function getDashboardData(f: DashFilters) {
  const supabase = await createClient();
  let q = supabase
    .from("orders")
    .select("id, status, delivery_date, created_at, ready_at, delivered_at, external, po_number, trip_id, driver_id, sales_rep_id, driver:profiles!orders_driver_id_fkey(full_name), rep:sales_reps(name), branch:branches(name, customer_id, customer:customers(name))")
    .gte("delivery_date", f.from).lte("delivery_date", f.to)
    .order("delivery_date", { ascending: false }).order("created_at", { ascending: false })
    .limit(5000);
  if (f.driver === "external") q = q.eq("external", true);
  else if (f.driver) q = q.eq("driver_id", f.driver);
  if (f.rep) q = q.eq("sales_rep_id", f.rep);
  const { data } = await q;
  let raw = (data ?? []) as unknown as Raw[];
  if (f.customer) raw = raw.filter((o) => o.branch?.customer_id === f.customer);

  const failedIds = raw.filter((o) => o.status === "failed").map((o) => o.id);
  const reasonByOrder = new Map<string, string | null>();
  if (failedIds.length) {
    const { data: ev } = await supabase.from("order_events").select("order_id, meta, created_at").eq("to_status", "failed").in("order_id", failedIds).order("created_at", { ascending: false });
    for (const e of ev ?? []) if (!reasonByOrder.has(e.order_id)) {
      const m = (e.meta ?? {}) as Record<string, unknown>;
      reasonByOrder.set(e.order_id, typeof m.reason_id === "string" ? m.reason_id : null);
    }
  }
  const orders: DashOrder[] = raw.map((o) => ({
    id: o.id, status: o.status, delivery_date: o.delivery_date, created_at: o.created_at, ready_at: o.ready_at, delivered_at: o.delivered_at,
    driver: o.external ? null : o.driver?.full_name ?? null, external: o.external, rep: o.rep?.name ?? null,
    customer: o.branch?.customer?.name ?? null, branch: o.branch?.name ?? null, po_number: o.po_number,
    reason_id: reasonByOrder.get(o.id) ?? null, trip_id: o.trip_id,
  }));

  // trips + km per driver in the range
  const { data: trips } = await supabase.from("trips").select("id, distance_m, started_at, driver:profiles(full_name)")
    .gte("started_at", `${f.from}T00:00:00+03:00`).lte("started_at", `${f.to}T23:59:59+03:00`);
  const tripStats = new Map<string, { trips: number; km: number }>();
  for (const t of (trips ?? []) as unknown as { distance_m: number | null; driver: { full_name: string } | null }[]) {
    const k = t.driver?.full_name ?? "—";
    const s = tripStats.get(k) ?? { trips: 0, km: 0 };
    s.trips += 1; s.km += (t.distance_m ?? 0) / 1000;
    tripStats.set(k, s);
  }
  return { orders, tripStats };
}

export async function getFilterOptions() {
  const supabase = await createClient();
  const [{ data: drivers }, { data: reps }, { data: customers }, { data: reasons }] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name").eq("role", "driver").order("full_name"),
    supabase.from("sales_reps").select("id, name").order("name"),
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("failure_reasons").select("id, icon, label_ar, label_en, label_ur"),
  ]);
  return { drivers: drivers ?? [], reps: reps ?? [], customers: customers ?? [], reasons: reasons ?? [] };
}

export async function getOrderDetail(id: string) {
  const supabase = await createClient();
  const [{ data: events }, { data: proofs }] = await Promise.all([
    supabase.from("order_events").select("from_status, to_status, meta, created_at, actor_id").eq("order_id", id).order("created_at"),
    supabase.from("proofs").select("outcome, photo_path, far_from_store, recorded_at, note, lat, lng").eq("order_id", id).order("recorded_at", { ascending: false }),
  ]);
  const actorIds = [...new Set((events ?? []).map((e) => e.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("user_id, full_name").in("user_id", actorIds) : { data: [] };
  const names = new Map((actors ?? []).map((a) => [a.user_id, a.full_name]));
  const proof = proofs?.[0] ?? null;
  let photoUrl: string | null = null;
  if (proof?.photo_path) {
    const { data } = await supabase.storage.from("proofs").createSignedUrl(proof.photo_path, 600);
    photoUrl = data?.signedUrl ?? null;
  }
  return {
    events: (events ?? []).map((e) => ({ ...e, actor: e.actor_id ? names.get(e.actor_id) ?? "" : "" })),
    proof, photoUrl,
  };
}
