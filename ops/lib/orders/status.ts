export const ORDER_STATUSES = ["new", "ready", "on_the_way", "delivered", "failed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ROLES = ["admin", "sales", "warehouse", "driver"] as const;
export type Role = (typeof ROLES)[number];

type Ctx = { from: OrderStatus; to: OrderStatus; role: Role; external: boolean; isAssignedDriver: boolean };

/** Mirrors public.transition_order in supabase/migrations/0002_order_functions.sql. Keep both in sync. */
export function canTransition({ from, to, role, external, isAssignedDriver }: Ctx): boolean {
  const office = role === "sales" || role === "admin";
  if (from === "new" && to === "ready") return role === "warehouse" || role === "admin";
  if (from === "ready" && to === "new") return role === "warehouse" || role === "admin";
  if (from === "ready" && to === "on_the_way") return role === "driver" && !external && isAssignedDriver;
  if (from === "on_the_way" && (to === "delivered" || to === "failed")) return role === "driver" && isAssignedDriver;
  if (from === "ready" && (to === "delivered" || to === "failed")) return office && external;
  if (from === "failed" && (to === "new" || to === "cancelled")) return office;
  if ((from === "new" || from === "ready") && to === "cancelled") return office;
  return false;
}
