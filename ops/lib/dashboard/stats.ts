export type DashOrder = {
  id: string; status: string; delivery_date: string; created_at: string; ready_at: string | null; delivered_at: string | null;
  driver: string | null; external: boolean; rep: string | null; customer: string | null; branch: string | null; po_number: string;
  reason_id: string | null; trip_id: string | null;
};
export type Kpis = { total: number; new: number; ready: number; on_the_way: number; delivered: number; failed: number; cancelled: number; successPct: number | null };
export type Row = { key: string; orders: number; delivered: number; failed: number; successPct: number | null };

const pct = (d: number, f: number) => (d + f === 0 ? null : Math.round((d / (d + f)) * 100));

export function kpis(orders: DashOrder[]): Kpis {
  const c = (s: string) => orders.filter((o) => o.status === s).length;
  const delivered = c("delivered"), failed = c("failed");
  return { total: orders.filter((o) => o.status !== "cancelled").length, new: c("new"), ready: c("ready"), on_the_way: c("on_the_way"),
    delivered, failed, cancelled: c("cancelled"), successPct: pct(delivered, failed) };
}

/** Average minutes between two timestamps over the orders that have both. */
export function avgMinutes(orders: DashOrder[], from: "created_at" | "ready_at", to: "ready_at" | "delivered_at"): number | null {
  const mins = orders
    .filter((o) => o[from] && o[to])
    .map((o) => (new Date(o[to]!).getTime() - new Date(o[from]!).getTime()) / 60000)
    .filter((m) => m >= 0);
  return mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null;
}

export function groupRows(orders: DashOrder[], keyOf: (o: DashOrder) => string | null): Row[] {
  const m = new Map<string, Row>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const key = keyOf(o) ?? "—";
    const r = m.get(key) ?? { key, orders: 0, delivered: 0, failed: 0, successPct: null };
    r.orders += 1;
    if (o.status === "delivered") r.delivered += 1;
    if (o.status === "failed") r.failed += 1;
    m.set(key, r);
  }
  return [...m.values()].map((r) => ({ ...r, successPct: pct(r.delivered, r.failed) })).sort((a, b) => b.orders - a.orders || a.key.localeCompare(b.key, "ar"));
}

export function reasonCounts(orders: DashOrder[]): { reason_id: string | null; count: number }[] {
  const m = new Map<string | null, number>();
  for (const o of orders) if (o.status === "failed") m.set(o.reason_id, (m.get(o.reason_id) ?? 0) + 1);
  return [...m.entries()].map(([reason_id, count]) => ({ reason_id, count })).sort((a, b) => b.count - a.count);
}
