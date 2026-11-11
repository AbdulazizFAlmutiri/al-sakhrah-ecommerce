import { describe, expect, it } from "vitest";
import { avgMinutes, groupRows, kpis, reasonCounts, type DashOrder } from "@/lib/dashboard/stats";

const base: DashOrder = { id: "", status: "new", delivery_date: "2026-11-11", created_at: "2026-11-11T05:00:00Z", ready_at: null, delivered_at: null,
  driver: "عارف", external: false, rep: "مجد", customer: "الحسين توب", branch: "الربوة", po_number: "", reason_id: null, trip_id: null };
const o = (p: Partial<DashOrder>): DashOrder => ({ ...base, ...p });

const orders = [
  o({ id: "1", status: "delivered", ready_at: "2026-11-11T05:30:00Z", delivered_at: "2026-11-11T06:30:00Z" }),
  o({ id: "2", status: "delivered", ready_at: "2026-11-11T05:10:00Z", delivered_at: "2026-11-11T05:40:00Z", driver: "نعيم", rep: "ناصر" }),
  o({ id: "3", status: "failed", ready_at: "2026-11-11T05:20:00Z", reason_id: "closed" }),
  o({ id: "4", status: "failed", reason_id: "closed", driver: "نعيم" }),
  o({ id: "5", status: "failed", reason_id: "refused" }),
  o({ id: "6", status: "cancelled" }),
  o({ id: "7", status: "on_the_way" }),
];

describe("dashboard stats", () => {
  it("counts KPIs and success rate (delivered / closed), excluding cancelled from total", () => {
    expect(kpis(orders)).toMatchObject({ total: 6, delivered: 2, failed: 3, cancelled: 1, on_the_way: 1, successPct: 40 });
    expect(kpis([]).successPct).toBeNull();
  });
  it("averages durations over orders that have both timestamps", () => {
    expect(avgMinutes(orders, "created_at", "ready_at")).toBe(20); // 30, 10, 20
    expect(avgMinutes(orders, "ready_at", "delivered_at")).toBe(45); // 60, 30
  });
  it("groups by key with per-group success", () => {
    const rows = groupRows(orders, (x) => x.driver);
    expect(rows[0]).toMatchObject({ key: "عارف", orders: 4, delivered: 1, failed: 2, successPct: 33 });
    expect(rows[1]).toMatchObject({ key: "نعيم", orders: 2, delivered: 1, failed: 1, successPct: 50 });
  });
  it("ranks failure reasons", () => {
    expect(reasonCounts(orders)).toEqual([{ reason_id: "closed", count: 2 }, { reason_id: "refused", count: 1 }]);
  });
});
