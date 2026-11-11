export type LaneOrder = { driver_id: string | null; external: boolean; stop_seq: number | null; status_changed_at: string };
export type Lane<T> = { key: string; label: string; external: boolean; orders: T[] };

export function groupByDriver<T extends LaneOrder>(
  orders: T[],
  drivers: { user_id: string; full_name: string }[],
  externalLabel: string,
): Lane<T>[] {
  const names = new Map(drivers.map((d) => [d.user_id, d.full_name]));
  const byKey = new Map<string, Lane<T>>();
  for (const o of orders) {
    const key = o.external || !o.driver_id ? "external" : o.driver_id;
    if (!byKey.has(key)) {
      byKey.set(key, { key, external: key === "external", label: key === "external" ? externalLabel : names.get(key) ?? key, orders: [] });
    }
    byKey.get(key)!.orders.push(o);
  }
  const cmp = (a: T, b: T) =>
    (a.stop_seq ?? Infinity) - (b.stop_seq ?? Infinity) || a.status_changed_at.localeCompare(b.status_changed_at);
  const lanes = [...byKey.values()];
  lanes.forEach((l) => l.orders.sort(cmp));
  return lanes.sort((a, b) => Number(a.external) - Number(b.external) || a.label.localeCompare(b.label, "ar"));
}
