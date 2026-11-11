import type { MessageKey } from "@/lib/i18n";
import type { Role } from "@/lib/orders/status";

const HOME: Record<Role, string> = {
  admin: "/admin/users",
  sales: "/board",
  warehouse: "/warehouse",
  driver: "/driver",
};

export function homeFor(role: Role): string {
  return HOME[role];
}

export type NavItem = { href: string; key: MessageKey; icon: string };

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin/users", key: "nav.users", icon: "group" },
    { href: "/dashboard", key: "nav.dashboard", icon: "monitoring" },
    { href: "/board", key: "nav.board", icon: "local_shipping" },
    { href: "/board/new", key: "nav.new_order", icon: "add_box" },
    { href: "/board/map", key: "nav.map", icon: "map" },
    { href: "/board/failed", key: "nav.failed", icon: "assignment_late" },
    { href: "/customers", key: "nav.customers", icon: "storefront" },
    { href: "/warehouse", key: "nav.warehouse", icon: "inventory_2" },
    { href: "/admin/settings", key: "nav.settings", icon: "settings" },
  ],
  sales: [
    { href: "/board", key: "nav.board", icon: "local_shipping" },
    { href: "/board/new", key: "nav.new_order", icon: "add_box" },
    { href: "/board/map", key: "nav.map", icon: "map" },
    { href: "/board/failed", key: "nav.failed", icon: "assignment_late" },
    { href: "/customers", key: "nav.customers", icon: "storefront" },
    { href: "/dashboard", key: "nav.dashboard", icon: "monitoring" },
  ],
  warehouse: [{ href: "/warehouse", key: "nav.warehouse", icon: "inventory_2" }],
  driver: [{ href: "/driver", key: "nav.driver", icon: "route" }],
};

/** Which roles may open a route prefix. Used by the (app) layout guard. */
export const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/board", roles: ["admin", "sales"] },
  { prefix: "/customers", roles: ["admin", "sales"] },
  { prefix: "/dashboard", roles: ["admin", "sales"] },
  { prefix: "/warehouse", roles: ["admin", "warehouse"] },
  { prefix: "/driver", roles: ["driver"] },
];

export function canOpen(role: Role, pathname: string): boolean {
  const rule = ROUTE_ROLES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  return rule ? rule.roles.includes(role) : true;
}
