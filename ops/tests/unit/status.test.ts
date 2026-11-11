import { describe, expect, it } from "vitest";
import { canTransition, type OrderStatus, type Role } from "@/lib/orders/status";

type Case = [OrderStatus, OrderStatus, Role, { external?: boolean; assigned?: boolean }, boolean];

const cases: Case[] = [
  ["new", "ready", "warehouse", {}, true],
  ["new", "ready", "admin", {}, true],
  ["new", "ready", "sales", {}, false],
  ["new", "ready", "driver", { assigned: true }, false],
  ["ready", "new", "warehouse", {}, true],
  ["ready", "on_the_way", "driver", { assigned: true }, true],
  ["ready", "on_the_way", "driver", { assigned: false }, false],
  ["ready", "on_the_way", "driver", { assigned: true, external: true }, false],
  ["on_the_way", "delivered", "driver", { assigned: true }, true],
  ["on_the_way", "failed", "driver", { assigned: true }, true],
  ["on_the_way", "delivered", "driver", { assigned: false }, false],
  ["on_the_way", "delivered", "sales", {}, false],
  ["ready", "delivered", "sales", { external: true }, true],
  ["ready", "failed", "admin", { external: true }, true],
  ["ready", "delivered", "sales", { external: false }, false],
  ["failed", "new", "sales", {}, true],
  ["failed", "cancelled", "admin", {}, true],
  ["failed", "new", "warehouse", {}, false],
  ["new", "cancelled", "sales", {}, true],
  ["ready", "cancelled", "sales", {}, true],
  ["on_the_way", "cancelled", "sales", {}, false],
  ["delivered", "new", "admin", {}, false],
  ["cancelled", "new", "admin", {}, false],
];

describe("canTransition", () => {
  it.each(cases)("%s -> %s as %s %o = %s", (from, to, role, o, expected) => {
    expect(
      canTransition({ from, to, role, external: o.external ?? false, isAssignedDriver: o.assigned ?? false }),
    ).toBe(expected);
  });
});
