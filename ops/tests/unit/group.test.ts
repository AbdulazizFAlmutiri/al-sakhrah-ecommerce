import { describe, expect, it } from "vitest";
import { groupByDriver } from "@/lib/orders/group";

const o = (id: string, driver_id: string | null, stop_seq: number | null, t: string) =>
  ({ id, driver_id, external: driver_id === null, stop_seq, status_changed_at: t });

describe("groupByDriver", () => {
  const drivers = [{ user_id: "n", full_name: "نعيم" }, { user_id: "a", full_name: "عارف" }, { user_id: "z", full_name: "زياد" }];
  const lanes = groupByDriver(
    [o("1", "a", 2, "2026-11-11T07:00:00Z"), o("2", null, null, "2026-11-11T07:00:00Z"), o("3", "a", 1, "2026-11-11T08:00:00Z"),
     o("4", "n", null, "2026-11-11T09:00:00Z"), o("5", "n", null, "2026-11-11T06:00:00Z")],
    drivers, "سيارة خارجية");

  it("makes one lane per driver with orders, external last, drivers by name", () => {
    expect(lanes.map((l) => l.label)).toEqual(["عارف", "نعيم", "سيارة خارجية"]);
    expect(lanes[2].external).toBe(true);
  });
  it("orders stops by stop_seq, then by status time", () => {
    expect(lanes[0].orders.map((x) => x.id)).toEqual(["3", "1"]);
    expect(lanes[1].orders.map((x) => x.id)).toEqual(["5", "4"]);
  });
  it("labels unknown drivers by id instead of dropping them", () => {
    const l = groupByDriver([o("9", "ghost", null, "2026-11-11T07:00:00Z")], drivers, "x");
    expect(l[0].label).toBe("ghost");
  });
});
