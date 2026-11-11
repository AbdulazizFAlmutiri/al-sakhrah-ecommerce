# Al-Sakhrah Ops — Plan 2: Orders Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sales can manage customers and branches, enter orders and assign them to a driver or the external car, and see a live "Today" board grouped by driver. The warehouse marks orders ready (and can undo within 5 minutes). Sales can close external-car orders as delivered or not delivered, and reschedule or cancel failed orders.

**Architecture:** This plan builds on Plan 1. All status changes go through `transition_order`; reasons and notes for failures live in `order_events.meta`. Pure helpers (grouping, Arabic-aware branch search, Riyadh date, durations) live in `lib/` and are unit-tested. Pages are server components with server actions. A tiny client component subscribes to Supabase Realtime on `orders` and calls `router.refresh()`.

**Tech Stack:** Same as Plan 1. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-logistics-platform-phase1-design.md` §4, §7.

## Global Constraints

- All Plan 1 constraints apply, including the requirement to read `node_modules/next/dist/docs/` first.
- In Next 16, page `searchParams` is a `Promise` and must be awaited.
- Branches are added with a Google Maps link or coordinates (`resolveMapsLink`). Google Places search is added in Plan 3, once the Maps API keys exist.
- The PO photo upload is deferred to Plan 3, together with the proof-photo storage bucket.
- An order's delivery date defaults to Riyadh "today" (`Asia/Riyadh`).
- Every new UI string must exist in `en`, `ar` and `ur`; the i18n test enforces this.

## File Structure

```
ops/supabase/migrations/0007_status_changed_at_realtime.sql
ops/supabase/tests/040_orders_flow.test.sql
ops/lib/time.ts                     riyadhToday, addDays, ageParts
ops/lib/orders/group.ts             groupByDriver
ops/lib/orders/queries.ts           server queries for board / warehouse / failed / form options
ops/lib/customers/branchSearch.ts   normalizeAr, matchBranches
ops/components/orders/StatusChip.tsx, Age.tsx, LiveRefresh.tsx
ops/app/(app)/customers/page.tsx, CustomerForms.tsx, actions.ts
ops/app/(app)/board/page.tsx (replace), OrderCard.tsx, actions.ts
ops/app/(app)/board/new/page.tsx, OrderForm.tsx, actions.ts
ops/app/(app)/board/failed/page.tsx, FailedRow.tsx, actions.ts
ops/app/(app)/warehouse/page.tsx (replace), ReadyButton.tsx, actions.ts
ops/tests/unit/time.test.ts, group.test.ts, branchSearch.test.ts
ops/tests/e2e/orders.spec.ts
```

---

### Task 1: Database — status timestamp and Realtime

**Files:**
- Create: `ops/supabase/migrations/0007_status_changed_at_realtime.sql`
- Test: `ops/supabase/tests/040_orders_flow.test.sql`

**Interfaces:**
- Produces: the column `orders.status_changed_at timestamptz`, which every transition updates. `orders` is added to the `supabase_realtime` publication when that publication exists.

- [ ] **Step 1: Write the failing test** at `ops/supabase/tests/040_orders_flow.test.sql`

```sql
begin;
do $$
declare
  v_sales uuid := tests.make_user('sales2', 'sales');
  v_wh uuid := tests.make_user('wh2', 'warehouse');
  v_cust uuid; v_branch uuid; v_rep uuid; v_o uuid; v_reason uuid; v_row orders; v_before timestamptz;
begin
  insert into customers(name) values ('مترو ماركت') returning id into v_cust;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'لبن', 24.62, 46.58) returning id into v_branch;
  insert into sales_reps(name) values ('أبو عبدالله') returning id into v_rep;
  insert into orders(branch_id, sales_rep_id, po_number, external, created_by)
    values (v_branch, v_rep, 'PO-9', true, v_sales) returning id into v_o;
  select status_changed_at into v_before from orders where id = v_o;
  perform tests.expect_eq(v_before is not null, true, 'status_changed_at default');
  update orders set status_changed_at = now() - interval '1 hour' where id = v_o;

  perform tests.login(v_wh);
  v_row := transition_order(v_o, 'ready');
  perform tests.expect_eq(v_row.status_changed_at > now() - interval '1 minute', true, 'status_changed_at bumped');

  select id into v_reason from failure_reasons where code = 'closed';
  perform tests.login(v_sales);
  v_row := transition_order(v_o, 'failed', jsonb_build_object('reason_id', v_reason, 'note', 'مقفل الظهر'));
  perform tests.logout();
  perform tests.expect_eq(
    (select meta->>'reason_id' from order_events where order_id = v_o and to_status = 'failed'),
    v_reason::text, 'reason stored in event meta');
end $$;
rollback;
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd ops && npm run test:sql`
Expected: FAIL in `040_orders_flow.test.sql` with `column "status_changed_at" does not exist`.

- [ ] **Step 3: Write `ops/supabase/migrations/0007_status_changed_at_realtime.sql`.** Copy the full body of `transition_order` from `0002_order_functions.sql` and add one line to its `UPDATE`.

```sql
alter table public.orders add column status_changed_at timestamptz not null default now();

create or replace function public.transition_order(p_order_id uuid, p_to public.order_status, p_meta jsonb default '{}'::jsonb)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_role app_role := app_role();
  v_o orders;
  v_from order_status;
  v_office boolean;
  v_ok boolean;
  v_resched boolean;
begin
  if v_role is null then raise exception 'not_authorized' using errcode = '42501'; end if;
  select * into v_o from orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  v_from := v_o.status;
  v_office := v_role in ('sales', 'admin');

  v_ok := case
    when v_from = 'new' and p_to = 'ready' then v_role in ('warehouse', 'admin')
    when v_from = 'ready' and p_to = 'new' then v_role in ('warehouse', 'admin')
    when v_from = 'ready' and p_to = 'on_the_way' then v_role = 'driver' and not v_o.external and v_o.driver_id = auth.uid()
    when v_from = 'on_the_way' and p_to in ('delivered', 'failed') then v_role = 'driver' and v_o.driver_id = auth.uid()
    when v_from = 'ready' and p_to in ('delivered', 'failed') then v_office and v_o.external
    when v_from = 'failed' and p_to in ('new', 'cancelled') then v_office
    when v_from in ('new', 'ready') and p_to = 'cancelled' then v_office
    else false
  end;
  if not v_ok then raise exception 'invalid_transition' using errcode = '22023'; end if;

  if v_from = 'ready' and p_to = 'new' and v_role = 'warehouse'
     and v_o.ready_at < now() - interval '5 minutes' then
    raise exception 'undo_window_passed' using errcode = '22023';
  end if;

  v_resched := v_from = 'failed' and p_to = 'new';

  update orders set
    status = p_to,
    status_changed_at = now(),
    ready_at = case when p_to = 'ready' then now() when p_to = 'new' then null else ready_at end,
    delivered_at = case when p_to = 'delivered' then now() else delivered_at end,
    delivery_date = case when v_resched and p_meta ? 'delivery_date'
                         then (p_meta->>'delivery_date')::date else delivery_date end,
    external = case when v_resched and p_meta ? 'external'
                    then (p_meta->>'external')::boolean else external end,
    driver_id = case when v_resched and p_meta ? 'external'
                     then case when (p_meta->>'external')::boolean then null else (p_meta->>'driver_id')::uuid end
                     else driver_id end,
    trip_id = case when p_to = 'new' then null else trip_id end,
    stop_seq = case when p_to = 'new' then null else stop_seq end,
    eta = case when p_to in ('new', 'delivered', 'failed', 'cancelled') then null else eta end
  where id = p_order_id
  returning * into v_o;

  insert into order_events(order_id, actor_id, from_status, to_status, meta)
  values (p_order_id, auth.uid(), v_from, p_to, coalesce(p_meta, '{}'::jsonb));

  return v_o;
end $$;

-- Live board updates (Supabase only; the local test cluster has no publication).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
```

- [ ] **Step 4: Run all the SQL tests**

Run: `cd ops && npm run test:sql`
Expected: `ALL SQL TESTS PASSED`.

- [ ] **Step 5: Apply the migration.** Use MCP `apply_migration` with name `0007_status_changed_at_realtime` on project `dlsqfotdgypkgdswdlym`. Then run `get_advisors` with type `security`; it should report no new findings. Then regenerate `ops/lib/db/types.ts`: add `status_changed_at: string` to `OrderRow`, and `status_changed_at?: string` to the orders `Insert` and `Update` types.

- [ ] **Step 6: Commit** with message `feat(ops): track status change time and publish orders to realtime`.

---

### Task 2: Pure helpers — Riyadh date, durations, grouping, Arabic branch search

**Files:**
- Create: `ops/lib/time.ts`, `ops/lib/orders/group.ts`, `ops/lib/customers/branchSearch.ts`
- Test: `ops/tests/unit/time.test.ts`, `ops/tests/unit/group.test.ts`, `ops/tests/unit/branchSearch.test.ts`

**Interfaces:**
- Produces:
  - `riyadhToday(now?: Date): string` (YYYY-MM-DD), `addDays(date: string, n: number): string`, `isIsoDate(s: string): boolean`, `ageParts(fromIso: string, now?: Date): { h: number; m: number }`.
  - `type LaneOrder = { driver_id: string | null; external: boolean; stop_seq: number | null; status_changed_at: string }`, `type Lane<T> = { key: string; label: string; external: boolean; orders: T[] }`, `groupByDriver<T extends LaneOrder>(orders: T[], drivers: { user_id: string; full_name: string }[], externalLabel: string): Lane<T>[]`.
  - `normalizeAr(s: string): string`, `type BranchOption = { id: string; customer: string; name: string }`, `matchBranches(q: string, list: BranchOption[], limit?: number): BranchOption[]`.

- [ ] **Step 1: Write the failing tests**

`ops/tests/unit/time.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { addDays, ageParts, isIsoDate, riyadhToday } from "@/lib/time";

describe("time", () => {
  it("uses the Riyadh calendar day", () => {
    // 22:30 UTC is 01:30 next day in Riyadh (UTC+3)
    expect(riyadhToday(new Date("2026-11-11T22:30:00Z"))).toBe("2026-11-12");
    expect(riyadhToday(new Date("2026-11-11T08:00:00Z"))).toBe("2026-11-11");
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("validates ISO dates", () => {
    expect(isIsoDate("2026-11-11")).toBe(true);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("11/11/2026")).toBe(false);
  });
  it("splits an age into hours and minutes", () => {
    const now = new Date("2026-11-11T10:00:00Z");
    expect(ageParts("2026-11-11T09:58:30Z", now)).toEqual({ h: 0, m: 1 });
    expect(ageParts("2026-11-11T07:35:00Z", now)).toEqual({ h: 2, m: 25 });
    expect(ageParts("2026-11-11T10:05:00Z", now)).toEqual({ h: 0, m: 0 });
  });
});
```

`ops/tests/unit/group.test.ts`:
```ts
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
```

`ops/tests/unit/branchSearch.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { matchBranches, normalizeAr } from "@/lib/customers/branchSearch";

const list = [
  { id: "1", customer: "الحسين توب", name: "مخرج ٦" },
  { id: "2", customer: "الحسين توب", name: "الربوة" },
  { id: "3", customer: "البيت السوري", name: "النهضة" },
  { id: "4", customer: "مترو ماركت", name: "لبن" },
];

describe("branch search", () => {
  it("normalizes alef, ya, ta marbuta, tashkeel and Arabic digits", () => {
    expect(normalizeAr("إسْتراحة  مُنى ٦")).toBe("استراحه مني 6");
  });
  it("matches all tokens across customer and branch name", () => {
    expect(matchBranches("حسين ربوه", list).map((b) => b.id)).toEqual(["2"]);
    expect(matchBranches("حسين", list).map((b) => b.id)).toEqual(["1", "2"]);
    expect(matchBranches("مخرج 6", list).map((b) => b.id)).toEqual(["1"]);
  });
  it("returns the first items for an empty query and respects the limit", () => {
    expect(matchBranches("", list, 2).map((b) => b.id)).toEqual(["1", "2"]);
  });
});
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `cd ops && npx vitest run tests/unit/time.test.ts tests/unit/group.test.ts tests/unit/branchSearch.test.ts`
Expected: FAIL with module-not-found errors.

- [ ] **Step 3: Implement the helpers**

`ops/lib/time.ts`:
```ts
const RIYADH = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" });

export function riyadhToday(now: Date = new Date()): string {
  return RIYADH.format(now);
}

export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function ageParts(fromIso: string, now: Date = new Date()): { h: number; m: number } {
  const mins = Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 60000));
  return { h: Math.floor(mins / 60), m: mins % 60 };
}
```

`ops/lib/orders/group.ts`:
```ts
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
```

`ops/lib/customers/branchSearch.ts`:
```ts
export type BranchOption = { id: string; customer: string; name: string };

export function normalizeAr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[آأإا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, " ")
    .trim();
}

export function matchBranches(q: string, list: BranchOption[], limit = 8): BranchOption[] {
  const tokens = normalizeAr(q).split(" ").filter(Boolean);
  if (tokens.length === 0) return list.slice(0, limit);
  return list
    .filter((b) => {
      const hay = normalizeAr(`${b.customer} ${b.name}`);
      return tokens.every((t) => hay.includes(t));
    })
    .slice(0, limit);
}
```

- [ ] **Step 4: Run the tests**

Run: `cd ops && npx vitest run`
Expected: all tests pass.

- [ ] **Step 5: Commit** with message `feat(ops): add Riyadh date, lane grouping and Arabic branch search helpers`.

---

### Task 3: i18n keys, navigation, route guard, error mapping

**Files:**
- Modify: `ops/lib/i18n/en.ts`, `ops/lib/i18n/ar.ts`, `ops/lib/i18n/ur.ts`, `ops/lib/auth/roles.ts`, `ops/lib/db/errors.ts`
- Test: `ops/tests/unit/i18n.test.ts` (existing), `ops/tests/unit/roles.test.ts`, `ops/tests/unit/errors.test.ts`

**Interfaces:**
- Produces the message keys used by Tasks 4–7, the nav entries `/board/new`, `/board/failed` and `/customers`, and the route rule `/customers` → admin and sales.

- [ ] **Step 1: Add the failing role test** to `ops/tests/unit/roles.test.ts`, inside `describe("canOpen")`:

```ts
  it("lets sales and admin manage customers", () => {
    expect(canOpen("sales", "/customers")).toBe(true);
    expect(canOpen("warehouse", "/customers")).toBe(false);
    expect(canOpen("driver", "/board/new")).toBe(false);
  });
```

Also add to `ops/tests/unit/errors.test.ts`:
```ts
  it("maps order and customer errors", () => {
    expect(dbErrorKey('duplicate key value violates unique constraint "customers_name_key"')).toBe("customers.error_taken");
    expect(dbErrorKey('duplicate key value violates unique constraint "branches_customer_id_name_key"')).toBe("customers.error_taken");
    expect(dbErrorKey("invalid_transition")).toBe("order.error_transition");
    expect(dbErrorKey("undo_window_passed")).toBe("wh.error_undo");
    expect(dbErrorKey("invalid_driver")).toBe("order.error_driver");
  });
```

Run: `cd ops && npx vitest run`
Expected: FAIL; the new keys don't exist yet, and `/customers` is open to every role.

- [ ] **Step 2: Add the keys to `ops/lib/i18n/en.ts`**, before the closing `} as const;`

```ts
  "nav.new_order": "New order",
  "nav.failed": "Not delivered",
  "nav.customers": "Customers",
  "status.new": "Waiting for warehouse",
  "status.ready": "Ready",
  "status.on_the_way": "On the way",
  "status.delivered": "Delivered",
  "status.failed": "Not delivered",
  "status.cancelled": "Cancelled",
  "time.just_now": "just now",
  "time.m": "{m} min",
  "time.hm": "{h} h {m} min",
  "board.title": "Deliveries",
  "board.today": "Today",
  "board.prev_day": "Previous day",
  "board.next_day": "Next day",
  "board.empty": "No orders for this day yet.",
  "board.external": "External car",
  "board.orders_n": "{n} orders",
  "board.rep": "Rep",
  "board.po": "PO",
  "board.cancel": "Cancel order",
  "board.mark_delivered": "Delivered",
  "board.mark_failed": "Not delivered",
  "board.reason": "Reason",
  "board.note": "Note (optional)",
  "board.confirm": "Confirm",
  "board.live": "Live",
  "order.title": "New order",
  "order.branch": "Store branch",
  "order.branch_search": "Type the store or branch name…",
  "order.branch_missing": "Branch not in the list?",
  "order.add_branch": "Add a branch",
  "order.rep": "Sales rep",
  "order.po": "PO number",
  "order.driver": "Driver",
  "order.date": "Delivery date",
  "order.notes": "Notes",
  "order.save": "Save",
  "order.save_another": "Save & add another",
  "order.saved": "Order saved.",
  "order.choose": "Choose…",
  "order.error_branch": "Choose a branch from the list.",
  "order.error_required": "Fill in all required fields.",
  "order.error_transition": "This order was just changed by someone else. Refresh and try again.",
  "order.error_driver": "Choose an active driver.",
  "failed.title": "Not delivered",
  "failed.empty": "No undelivered orders.",
  "failed.reschedule": "Reschedule",
  "failed.cancel": "Cancel order",
  "failed.no_reason": "No reason given",
  "failed.since": "{date}",
  "wh.title": "Prepare today's orders",
  "wh.ready": "Ready",
  "wh.undo": "Undo",
  "wh.done": "Ready",
  "wh.empty": "Nothing to prepare today.",
  "wh.error_undo": "Too late to undo — tell the sales team.",
  "customers.title": "Customers & branches",
  "customers.add_customer": "Add customer",
  "customers.customer_name": "Customer name",
  "customers.add_branch": "Add branch",
  "customers.customer": "Customer",
  "customers.branch_name": "Branch name",
  "customers.phone": "Phone",
  "customers.location": "Google Maps link or coordinates",
  "customers.saved": "Saved.",
  "customers.error_taken": "This name already exists.",
  "customers.branches_n": "{n} branches",
  "customers.map": "Map",
```

- [ ] **Step 3: Add the same keys to `ops/lib/i18n/ar.ts`**

```ts
  "nav.new_order": "طلب جديد",
  "nav.failed": "لم يتم التسليم",
  "nav.customers": "العملاء",
  "status.new": "عند المستودع",
  "status.ready": "جاهز",
  "status.on_the_way": "في الطريق",
  "status.delivered": "تم التسليم",
  "status.failed": "لم يتم التسليم",
  "status.cancelled": "ملغي",
  "time.just_now": "الآن",
  "time.m": "{m} د",
  "time.hm": "{h} س {m} د",
  "board.title": "التوزيع",
  "board.today": "اليوم",
  "board.prev_day": "اليوم السابق",
  "board.next_day": "اليوم التالي",
  "board.empty": "لا توجد طلبات لهذا اليوم بعد.",
  "board.external": "سيارة خارجية",
  "board.orders_n": "{n} طلبات",
  "board.rep": "المندوب",
  "board.po": "أمر الشراء",
  "board.cancel": "إلغاء الطلب",
  "board.mark_delivered": "تم التسليم",
  "board.mark_failed": "لم يتم التسليم",
  "board.reason": "السبب",
  "board.note": "ملاحظة (اختياري)",
  "board.confirm": "تأكيد",
  "board.live": "مباشر",
  "order.title": "طلب جديد",
  "order.branch": "فرع المحل",
  "order.branch_search": "اكتب اسم المحل أو الفرع…",
  "order.branch_missing": "الفرع غير موجود؟",
  "order.add_branch": "أضف فرعاً",
  "order.rep": "المندوب",
  "order.po": "رقم أمر الشراء",
  "order.driver": "السائق",
  "order.date": "تاريخ التوصيل",
  "order.notes": "ملاحظات",
  "order.save": "حفظ",
  "order.save_another": "حفظ وإضافة طلب آخر",
  "order.saved": "تم حفظ الطلب.",
  "order.choose": "اختر…",
  "order.error_branch": "اختر الفرع من القائمة.",
  "order.error_required": "أكمل الحقول المطلوبة.",
  "order.error_transition": "تغيّر هذا الطلب للتو. حدّث الصفحة وحاول مرة أخرى.",
  "order.error_driver": "اختر سائقاً نشطاً.",
  "failed.title": "لم يتم التسليم",
  "failed.empty": "لا توجد طلبات غير مسلّمة.",
  "failed.reschedule": "إعادة الجدولة",
  "failed.cancel": "إلغاء الطلب",
  "failed.no_reason": "بدون سبب",
  "failed.since": "{date}",
  "wh.title": "تجهيز طلبات اليوم",
  "wh.ready": "جاهز",
  "wh.undo": "تراجع",
  "wh.done": "جاهز",
  "wh.empty": "لا توجد طلبات للتجهيز اليوم.",
  "wh.error_undo": "فات وقت التراجع — أبلغ المبيعات.",
  "customers.title": "العملاء والفروع",
  "customers.add_customer": "إضافة عميل",
  "customers.customer_name": "اسم العميل",
  "customers.add_branch": "إضافة فرع",
  "customers.customer": "العميل",
  "customers.branch_name": "اسم الفرع",
  "customers.phone": "الجوال",
  "customers.location": "رابط قوقل ماب أو الإحداثيات",
  "customers.saved": "تم الحفظ.",
  "customers.error_taken": "هذا الاسم موجود مسبقاً.",
  "customers.branches_n": "{n} فروع",
  "customers.map": "الخريطة",
```

- [ ] **Step 4: Add the same keys to `ops/lib/i18n/ur.ts`**

```ts
  "nav.new_order": "نیا آرڈر",
  "nav.failed": "ڈیلیوری نہیں ہوئی",
  "nav.customers": "گاہک",
  "status.new": "گودام میں",
  "status.ready": "تیار",
  "status.on_the_way": "راستے میں",
  "status.delivered": "ڈیلیور ہو گیا",
  "status.failed": "ڈیلیوری نہیں ہوئی",
  "status.cancelled": "منسوخ",
  "time.just_now": "ابھی",
  "time.m": "{m} منٹ",
  "time.hm": "{h} گھنٹے {m} منٹ",
  "board.title": "ڈیلیوریاں",
  "board.today": "آج",
  "board.prev_day": "پچھلا دن",
  "board.next_day": "اگلا دن",
  "board.empty": "اس دن کے لیے ابھی کوئی آرڈر نہیں۔",
  "board.external": "باہر کی گاڑی",
  "board.orders_n": "{n} آرڈر",
  "board.rep": "نمائندہ",
  "board.po": "پرچیز آرڈر",
  "board.cancel": "آرڈر منسوخ کریں",
  "board.mark_delivered": "ڈیلیور ہو گیا",
  "board.mark_failed": "ڈیلیوری نہیں ہوئی",
  "board.reason": "وجہ",
  "board.note": "نوٹ (اختیاری)",
  "board.confirm": "تصدیق",
  "board.live": "لائیو",
  "order.title": "نیا آرڈر",
  "order.branch": "دکان کی برانچ",
  "order.branch_search": "دکان یا برانچ کا نام لکھیں…",
  "order.branch_missing": "برانچ فہرست میں نہیں؟",
  "order.add_branch": "برانچ شامل کریں",
  "order.rep": "سیلز نمائندہ",
  "order.po": "پرچیز آرڈر نمبر",
  "order.driver": "ڈرائیور",
  "order.date": "ڈیلیوری کی تاریخ",
  "order.notes": "نوٹس",
  "order.save": "محفوظ کریں",
  "order.save_another": "محفوظ کریں اور نیا شامل کریں",
  "order.saved": "آرڈر محفوظ ہو گیا۔",
  "order.choose": "منتخب کریں…",
  "order.error_branch": "فہرست سے برانچ منتخب کریں۔",
  "order.error_required": "تمام ضروری خانے پُر کریں۔",
  "order.error_transition": "یہ آرڈر ابھی تبدیل ہوا ہے۔ صفحہ ریفریش کر کے دوبارہ کوشش کریں۔",
  "order.error_driver": "فعال ڈرائیور منتخب کریں۔",
  "failed.title": "ڈیلیوری نہیں ہوئی",
  "failed.empty": "کوئی غیر ڈیلیور شدہ آرڈر نہیں۔",
  "failed.reschedule": "دوبارہ شیڈول کریں",
  "failed.cancel": "آرڈر منسوخ کریں",
  "failed.no_reason": "کوئی وجہ نہیں دی گئی",
  "failed.since": "{date}",
  "wh.title": "آج کے آرڈر تیار کریں",
  "wh.ready": "تیار",
  "wh.undo": "واپس لیں",
  "wh.done": "تیار",
  "wh.empty": "آج تیار کرنے کے لیے کچھ نہیں۔",
  "wh.error_undo": "واپس لینے کا وقت گزر گیا — سیلز کو بتائیں۔",
  "customers.title": "گاہک اور برانچیں",
  "customers.add_customer": "گاہک شامل کریں",
  "customers.customer_name": "گاہک کا نام",
  "customers.add_branch": "برانچ شامل کریں",
  "customers.customer": "گاہک",
  "customers.branch_name": "برانچ کا نام",
  "customers.phone": "فون",
  "customers.location": "گوگل میپس لنک یا کوآرڈینیٹس",
  "customers.saved": "محفوظ ہو گیا۔",
  "customers.error_taken": "یہ نام پہلے سے موجود ہے۔",
  "customers.branches_n": "{n} برانچیں",
  "customers.map": "نقشہ",
```

- [ ] **Step 5: Update `ops/lib/auth/roles.ts`.** Replace `NAV_BY_ROLE.admin`, `NAV_BY_ROLE.sales` and `ROUTE_ROLES`:

```ts
  admin: [
    { href: "/admin/users", key: "nav.users", icon: "group" },
    { href: "/board", key: "nav.board", icon: "local_shipping" },
    { href: "/board/new", key: "nav.new_order", icon: "add_box" },
    { href: "/board/failed", key: "nav.failed", icon: "assignment_late" },
    { href: "/customers", key: "nav.customers", icon: "storefront" },
    { href: "/warehouse", key: "nav.warehouse", icon: "inventory_2" },
    { href: "/admin/settings", key: "nav.settings", icon: "settings" },
  ],
  sales: [
    { href: "/board", key: "nav.board", icon: "local_shipping" },
    { href: "/board/new", key: "nav.new_order", icon: "add_box" },
    { href: "/board/failed", key: "nav.failed", icon: "assignment_late" },
    { href: "/customers", key: "nav.customers", icon: "storefront" },
  ],
```

```ts
export const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/board", roles: ["admin", "sales"] },
  { prefix: "/customers", roles: ["admin", "sales"] },
  { prefix: "/warehouse", roles: ["admin", "warehouse"] },
  { prefix: "/driver", roles: ["driver"] },
];
```

- [ ] **Step 6: Extend `MAP` in `ops/lib/db/errors.ts`**

```ts
  ["customers_name_key", "customers.error_taken"],
  ["branches_customer_id_name_key", "customers.error_taken"],
  ["invalid_transition", "order.error_transition"],
  ["undo_window_passed", "wh.error_undo"],
  ["invalid_driver", "order.error_driver"],
```

- [ ] **Step 7: Run the tests**

Run: `cd ops && npx vitest run && npx tsc --noEmit`
Expected: everything passes.

- [ ] **Step 8: Commit** with message `feat(ops): add orders i18n, sales navigation and error mapping`.

---

### Task 4: Shared order UI and data queries

**Files:**
- Create: `ops/lib/orders/queries.ts`, `ops/components/orders/StatusChip.tsx`, `ops/components/orders/Age.tsx`, `ops/components/orders/LiveRefresh.tsx`

**Interfaces:**
- Produces:
  - `type BoardOrder = { id; status: OrderStatus; external: boolean; driver_id: string | null; po_number: string; notes: string | null; delivery_date: string; status_changed_at: string; ready_at: string | null; stop_seq: number | null; eta: string | null; branch: { name: string; customer: { name: string } | null } | null; rep: { name: string } | null }`
  - `getOrdersForDate(date: string): Promise<BoardOrder[]>` (excludes cancelled), `getFailedOrders(): Promise<(BoardOrder & { failed_at: string; reason_id: string | null; note: string | null })[]>`, `getActiveDrivers(): Promise<{ user_id: string; full_name: string }[]>`, `getFormOptions(): Promise<{ branches: BranchOption[]; reps: { id: string; name: string }[]; drivers: … }>`, `getReasons(): Promise<{ id; code; icon; label_ar; label_en; label_ur }[]>`.
  - `<StatusChip status t />`, `<Age since t now />`, `<LiveRefresh label />`.

- [ ] **Step 1: Write `ops/lib/orders/queries.ts`**

```ts
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
```

- [ ] **Step 2: Write the shared components**

`ops/components/orders/StatusChip.tsx`:
```tsx
import { Icon } from "@/components/ui/Icon";
import type { T } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders/status";

const STYLE: Record<OrderStatus, { cls: string; icon: string }> = {
  new: { cls: "bg-warn-50 text-warn-600", icon: "hourglass_top" },
  ready: { cls: "bg-royal-50 text-royal-600", icon: "inventory" },
  on_the_way: { cls: "bg-royal-600 text-white", icon: "local_shipping" },
  delivered: { cls: "bg-ok-50 text-ok-600", icon: "check_circle" },
  failed: { cls: "bg-bad-50 text-bad-600", icon: "cancel" },
  cancelled: { cls: "bg-mist-100 text-ink-500", icon: "block" },
};

export function StatusChip({ status, t }: { status: OrderStatus; t: T }) {
  const s = STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold ${s.cls}`}>
      <Icon name={s.icon} className="text-base" />
      {t(`status.${status}` as const)}
    </span>
  );
}
```

`ops/components/orders/Age.tsx`:
```tsx
import { ageParts } from "@/lib/time";
import type { T } from "@/lib/i18n";

export function Age({ since, t, now }: { since: string; t: T; now: Date }) {
  const { h, m } = ageParts(since, now);
  const text = h === 0 && m === 0 ? t("time.just_now") : h === 0 ? t("time.m", { m }) : t("time.hm", { h, m });
  return <span className="text-xs text-ink-500">{text}</span>;
}
```

`ops/components/orders/LiveRefresh.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/db/browser";

/** Re-renders the current server page when any visible order changes, plus a 60s safety refresh. */
export function LiveRefresh({ label }: { label: string }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .subscribe();
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => {
      clearInterval(interval);
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-ok-600">
      <span className="h-2 w-2 animate-pulse rounded-full bg-ok-600" />
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `cd ops && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit** with message `feat(ops): add order queries, status chip, age and live refresh components`.

---

### Task 5: Customers and branches screen

**Files:**
- Create: `ops/app/(app)/customers/page.tsx`, `ops/app/(app)/customers/CustomerForms.tsx`, `ops/app/(app)/customers/actions.ts`

**Interfaces:**
- Consumes: `resolveMapsLink`, `dbErrorKey`, `requireRole`, `ActionState` from `@/app/(app)/admin/users/actions`.
- Produces: `addCustomerAction(prev, fd)`, `addBranchAction(prev, fd)`. When the `return` field is present, a successful branch save redirects there with `?branch=<id>`.

- [ ] **Step 1: Write `ops/app/(app)/customers/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { resolveMapsLink } from "@/lib/maps/resolveMapsLink";
import type { ActionState } from "../admin/users/actions";

export async function addCustomerAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "order.error_required" };
  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({ name });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/customers");
  return { ok: true };
}

export async function addBranchAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const customer_id = String(fd.get("customer_id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim() || null;
  const link = String(fd.get("location") ?? "").trim();
  if (!customer_id || !name || !link) return { error: "order.error_required" };
  const pos = await resolveMapsLink(link);
  if (!pos) return { error: "settings.error_maps_link" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({ customer_id, name, phone, lat: pos.lat, lng: pos.lng, address_text: link })
    .select("id")
    .single();
  if (error || !data) return { error: dbErrorKey(error?.message ?? "") };
  revalidatePath("/customers");
  revalidatePath("/board/new");
  const ret = String(fd.get("return") ?? "");
  if (ret === "/board/new") redirect(`/board/new?branch=${data.id}`);
  return { ok: true };
}
```

- [ ] **Step 2: Write `ops/app/(app)/customers/CustomerForms.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `ops/app/(app)/customers/page.tsx`**

```tsx
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { AddBranchForm, AddCustomerForm } from "./CustomerForms";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ return?: string }> }) {
  await requireRole(["admin", "sales"]);
  const { return: returnTo } = await searchParams;
  const { t } = await getT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, branches(id, name, phone, lat, lng)")
    .order("name");
  const customers = (data ?? []) as { id: string; name: string; branches: { id: string; name: string; phone: string | null; lat: number; lng: number }[] }[];
  const labels = {
    customerName: t("customers.customer_name"), addCustomer: t("customers.add_customer"), customer: t("customers.customer"),
    branchName: t("customers.branch_name"), phone: t("customers.phone"), location: t("customers.location"),
    addBranch: t("customers.add_branch"), saved: t("customers.saved"), choose: t("order.choose"),
    errors: {
      "order.error_required": t("order.error_required"), "customers.error_taken": t("customers.error_taken"),
      "settings.error_maps_link": t("settings.error_maps_link"), "common.error_generic": t("common.error_generic"),
      "common.not_authorized": t("common.not_authorized"),
    },
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("customers.add_branch")} eyebrow="Branch">
          <AddBranchForm customers={customers.map(({ id, name }) => ({ id, name }))} labels={labels} returnTo={returnTo === "/board/new" ? returnTo : undefined} />
        </Card>
        <Card title={t("customers.add_customer")} eyebrow="Customer">
          <AddCustomerForm labels={labels} />
        </Card>
      </div>
      <Card title={t("customers.title")}>
        <ul className="divide-y divide-mist-200">
          {customers.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-navy-700">{c.name}</span>
                <span className="text-xs text-ink-500">{t("customers.branches_n", { n: c.branches.length })}</span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {c.branches.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 border border-mist-300 bg-white px-3 py-1 text-sm">
                    {b.name}
                    <a className="text-royal-600" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${b.lat},${b.lng}`} aria-label={t("customers.map")}>
                      <Icon name="location_on" className="text-base" />
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Type-check, build, commit.** Run `cd ops && npx tsc --noEmit && npx next build`. Commit with message `feat(ops): add customers and branches screen with Google Maps link locations`.

---

### Task 6: New order form

**Files:**
- Create: `ops/app/(app)/board/new/page.tsx`, `ops/app/(app)/board/new/OrderForm.tsx`, `ops/app/(app)/board/new/actions.ts`

**Interfaces:**
- Consumes: `getFormOptions`, `matchBranches`, `riyadhToday`, `isIsoDate`.
- Produces: `createOrderAction(prev, fd): Promise<OrderState>`, where `type OrderState = ActionState & { savedAt?: number }`. Intent `another` returns `{ ok, savedAt }` and the form resets; intent `save` redirects to `/board?date=<date>`.

- [ ] **Step 1: Write `ops/app/(app)/board/new/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { isIsoDate, riyadhToday } from "@/lib/time";
import type { ActionState } from "../../admin/users/actions";

export type OrderState = ActionState & { savedAt?: number };
const UUID = /^[0-9a-f-]{36}$/i;

export async function createOrderAction(_p: OrderState, fd: FormData): Promise<OrderState> {
  const user = await requireRole(["admin", "sales"]);
  const branch_id = String(fd.get("branch_id") ?? "");
  const sales_rep_id = String(fd.get("sales_rep_id") ?? "");
  const po_number = String(fd.get("po_number") ?? "").trim();
  const driver = String(fd.get("driver") ?? "");
  const date = String(fd.get("delivery_date") ?? "") || riyadhToday();
  const notes = String(fd.get("notes") ?? "").trim() || null;
  if (!UUID.test(branch_id)) return { error: "order.error_branch" };
  if (!UUID.test(sales_rep_id) || !po_number || !driver || !isIsoDate(date)) return { error: "order.error_required" };
  const external = driver === "external";
  if (!external && !UUID.test(driver)) return { error: "order.error_driver" };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({
    branch_id, sales_rep_id, po_number, notes, delivery_date: date,
    external, driver_id: external ? null : driver, created_by: user.id,
  });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board");
  if (fd.get("intent") === "another") return { ok: true, savedAt: Date.now() };
  redirect(`/board?date=${date}`);
}
```

- [ ] **Step 2: Write `ops/app/(app)/board/new/OrderForm.tsx`**

```tsx
"use client";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createOrderAction, type OrderState } from "./actions";
import { matchBranches, type BranchOption } from "@/lib/customers/branchSearch";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";

type Labels = Record<
  "branch" | "search" | "missing" | "addBranch" | "rep" | "po" | "driver" | "external" | "date" | "notes" | "save" | "another" | "saved" | "choose",
  string
> & { errors: Record<string, string> };

export function OrderForm(props: {
  branches: BranchOption[]; reps: { id: string; name: string }[]; drivers: { user_id: string; full_name: string }[];
  today: string; initialBranch?: string; labels: Labels;
}) {
  const [state, action, pending] = useActionState<OrderState, FormData>(createOrderAction, {});
  // Remount (clear) the fields after each "save & add another".
  return <Fields key={state.savedAt ?? 0} {...props} state={state} action={action} pending={pending} />;
}

function Fields({ branches, reps, drivers, today, initialBranch, labels, state, action, pending }: Parameters<typeof OrderForm>[0] & {
  state: OrderState; action: (fd: FormData) => void; pending: boolean;
}) {
  const initial = branches.find((b) => b.id === initialBranch) ?? null;
  const [picked, setPicked] = useState<BranchOption | null>(state.savedAt ? null : initial);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => matchBranches(q, branches), [q, branches]);
  const select = "h-11 border border-mist-300 bg-white px-2 text-base";

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="relative md:col-span-2">
        <span className="mb-1 block text-sm font-semibold text-ink-700">{labels.branch}</span>
        <input type="hidden" name="branch_id" value={picked?.id ?? ""} />
        {picked ? (
          <div className="flex h-11 items-center justify-between border border-royal-600 bg-royal-50 px-3">
            <span className="font-bold text-navy-700">{picked.customer} — {picked.name}</span>
            <button type="button" onClick={() => { setPicked(null); setQ(""); }} className="text-ink-500" aria-label="clear">
              <Icon name="close" />
            </button>
          </div>
        ) : (
          <input
            autoFocus value={q} placeholder={labels.search} role="combobox" aria-expanded={open} aria-controls="branch-list"
            onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
            className="h-11 w-full border border-mist-300 bg-white px-3 text-base outline-none focus:border-royal-600 focus:ring-2 focus:ring-royal-100"
          />
        )}
        {!picked && open && (
          <ul id="branch-list" role="listbox" className="absolute z-10 mt-1 max-h-72 w-full overflow-auto border border-mist-300 bg-white shadow-lg">
            {results.map((b) => (
              <li key={b.id} role="option" aria-selected={false}>
                <button type="button" onClick={() => { setPicked(b); setOpen(false); }} className="w-full px-3 py-2 text-start hover:bg-royal-50">
                  <span className="font-bold">{b.customer}</span> — {b.name}
                </button>
              </li>
            ))}
            <li className="border-t border-mist-200">
              <Link href="/customers?return=/board/new" className="flex items-center gap-2 px-3 py-2 text-sm text-royal-600">
                <Icon name="add_location_alt" />{labels.missing} {labels.addBranch}
              </Link>
            </li>
          </ul>
        )}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.rep}</span>
        <select name="sales_rep_id" required defaultValue="" className={select}>
          <option value="" disabled>{labels.choose}</option>
          {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>
      <Field label={labels.po} name="po_number" dir="ltr" required autoComplete="off" />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.driver}</span>
        <select name="driver" required defaultValue="" className={select}>
          <option value="" disabled>{labels.choose}</option>
          {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.full_name}</option>)}
          <option value="external">{labels.external}</option>
        </select>
      </label>
      <Field label={labels.date} name="delivery_date" type="date" defaultValue={today} dir="ltr" required />
      <label className="flex flex-col gap-1 text-sm md:col-span-2">
        <span className="font-semibold text-ink-700">{labels.notes}</span>
        <textarea name="notes" rows={2} className="border border-mist-300 bg-white px-3 py-2 text-base" />
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button type="submit" name="intent" value="another" size="lg" disabled={pending}>
          <Icon name="add" />{labels.another}
        </Button>
        <Button type="submit" name="intent" value="save" size="lg" variant="secondary" disabled={pending}>{labels.save}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Write `ops/app/(app)/board/new/page.tsx`**

```tsx
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getFormOptions } from "@/lib/orders/queries";
import { riyadhToday } from "@/lib/time";
import { Card } from "@/components/ui/Card";
import { OrderForm } from "./OrderForm";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  await requireRole(["admin", "sales"]);
  const { branch } = await searchParams;
  const { t } = await getT();
  const { branches, reps, drivers } = await getFormOptions();
  return (
    <Card title={t("order.title")} eyebrow="New order" className="mx-auto max-w-3xl">
      <OrderForm
        branches={branches} reps={reps} drivers={drivers} today={riyadhToday()} initialBranch={branch}
        labels={{
          branch: t("order.branch"), search: t("order.branch_search"), missing: t("order.branch_missing"), addBranch: t("order.add_branch"),
          rep: t("order.rep"), po: t("order.po"), driver: t("order.driver"), external: t("board.external"), date: t("order.date"),
          notes: t("order.notes"), save: t("order.save"), another: t("order.save_another"), saved: t("order.saved"), choose: t("order.choose"),
          errors: {
            "order.error_branch": t("order.error_branch"), "order.error_required": t("order.error_required"),
            "order.error_driver": t("order.error_driver"), "common.error_generic": t("common.error_generic"),
            "common.not_authorized": t("common.not_authorized"),
          },
        }}
      />
    </Card>
  );
}
```

- [ ] **Step 4: Type-check, build, commit.** Commit with message `feat(ops): add fast new-order form with Arabic branch search`.

---

### Task 7: Today's board, the not-delivered list, and the warehouse screen

**Files:**
- Create/replace: `ops/app/(app)/board/page.tsx`, `ops/app/(app)/board/OrderCard.tsx`, `ops/app/(app)/board/actions.ts`
- Create: `ops/app/(app)/board/failed/page.tsx`, `ops/app/(app)/board/failed/FailedRow.tsx`, `ops/app/(app)/board/failed/actions.ts`
- Replace: `ops/app/(app)/warehouse/page.tsx`; create `ops/app/(app)/warehouse/ReadyButton.tsx`, `ops/app/(app)/warehouse/actions.ts`

**Interfaces:**
- Consumes: `transition_order` RPC, `groupByDriver`, queries, `StatusChip`, `Age`, `LiveRefresh`.
- Produces: `cancelOrderAction(fd)`, `closeExternalAction(prev, fd)` (`outcome` = `delivered`|`failed`, `reason_id`, `note`), `rescheduleAction(prev, fd)`, `cancelFailedAction(prev, fd)`, `setReadyAction(prev, fd)` (`to` = `ready`|`new`).

- [ ] **Step 1: Write `ops/app/(app)/board/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import type { ActionState } from "../admin/users/actions";

export async function cancelOrderAction(fd: FormData): Promise<void> {
  await requireRole(["admin", "sales"]);
  const supabase = await createClient();
  await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: "cancelled", p_meta: {} });
  revalidatePath("/board");
}

export async function closeExternalAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const outcome = fd.get("outcome") === "delivered" ? "delivered" : "failed";
  const meta: Record<string, string> = {};
  const reason = String(fd.get("reason_id") ?? "");
  const note = String(fd.get("note") ?? "").trim();
  if (outcome === "failed" && reason) meta.reason_id = reason;
  if (note) meta.note = note;
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: outcome, p_meta: meta });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board");
  return { ok: true };
}
```

- [ ] **Step 2: Write `ops/app/(app)/board/OrderCard.tsx`**

```tsx
"use client";
import { useActionState, useState } from "react";
import { cancelOrderAction, closeExternalAction } from "./actions";
import type { ActionState } from "../admin/users/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";

export type CardLabels = Record<"rep" | "po" | "cancel" | "delivered" | "failed" | "reason" | "note" | "confirm" | "choose", string> & {
  errors: Record<string, string>;
};

/** Client-side controls for one order (the server renders the chip, age and texts and passes them in). */
export function OrderCardActions({ id, status, external, reasons, labels }: {
  id: string; status: string; external: boolean;
  reasons: { id: string; label: string; icon: string }[]; labels: CardLabels;
}) {
  const [mode, setMode] = useState<"none" | "failed">("none");
  const [state, action, pending] = useActionState<ActionState, FormData>(closeExternalAction, {});
  const canCancel = status === "new" || status === "ready";
  const canClose = external && status === "ready";
  if (!canCancel && !canClose) return null;
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-mist-200 pt-3">
      <div className="flex flex-wrap gap-2">
        {canClose && (
          <form action={action}>
            <input type="hidden" name="id" value={id} /><input type="hidden" name="outcome" value="delivered" />
            <Button type="submit" variant="secondary" disabled={pending} className="!h-9 text-ok-600"><Icon name="check_circle" />{labels.delivered}</Button>
          </form>
        )}
        {canClose && (
          <Button type="button" variant="ghost" className="!h-9 text-bad-600" onClick={() => setMode(mode === "failed" ? "none" : "failed")}>
            <Icon name="cancel" />{labels.failed}
          </Button>
        )}
        {canCancel && (
          <form action={cancelOrderAction} onSubmit={(e) => { if (!confirm(labels.cancel + "?")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="ghost" className="!h-9 text-ink-500"><Icon name="block" />{labels.cancel}</Button>
          </form>
        )}
      </div>
      {mode === "failed" && (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="outcome" value="failed" />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={labels.reason}>
            {reasons.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-1 border border-mist-300 px-2 py-1 text-sm has-[:checked]:border-bad-600 has-[:checked]:bg-bad-50">
                <input type="radio" name="reason_id" value={r.id} required className="sr-only" />
                <Icon name={r.icon} className="text-base" />{r.label}
              </label>
            ))}
          </div>
          <input name="note" placeholder={labels.note} className="h-9 border border-mist-300 px-2 text-sm" />
          <Button type="submit" variant="danger" disabled={pending} className="!h-9 self-start">{labels.confirm}</Button>
        </form>
      )}
      <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
    </div>
  );
}
```

- [ ] **Step 3: Write `ops/app/(app)/board/page.tsx`**

```tsx
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getActiveDrivers, getFailedOrders, getOrdersForDate, getReasons } from "@/lib/orders/queries";
import { groupByDriver } from "@/lib/orders/group";
import { addDays, isIsoDate, riyadhToday } from "@/lib/time";
import { ORDER_STATUSES } from "@/lib/orders/status";
import { Age } from "@/components/orders/Age";
import { LiveRefresh } from "@/components/orders/LiveRefresh";
import { StatusChip } from "@/components/orders/StatusChip";
import { Icon } from "@/components/ui/Icon";
import { OrderCardActions } from "./OrderCard";

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireRole(["admin", "sales"]);
  const { date: raw } = await searchParams;
  const today = riyadhToday();
  const date = raw && isIsoDate(raw) ? raw : today;
  const { t, locale } = await getT();
  const [orders, drivers, failed, reasons] = await Promise.all([getOrdersForDate(date), getActiveDrivers(), getFailedOrders(), getReasons()]);
  const lanes = groupByDriver(orders, drivers, t("board.external"));
  const now = new Date();
  const counts = ORDER_STATUSES.filter((s) => s !== "cancelled").map((s) => [s, orders.filter((o) => o.status === s).length] as const);
  const reasonOpts = reasons.map((r) => ({ id: r.id, icon: r.icon, label: locale === "en" ? r.label_en : locale === "ur" ? r.label_ur : r.label_ar }));
  const cardLabels = {
    rep: t("board.rep"), po: t("board.po"), cancel: t("board.cancel"), delivered: t("board.mark_delivered"), failed: t("board.mark_failed"),
    reason: t("board.reason"), note: t("board.note"), confirm: t("board.confirm"), choose: t("order.choose"),
    errors: { "order.error_transition": t("order.error_transition"), "common.error_generic": t("common.error_generic"), "common.not_authorized": t("common.not_authorized") },
  };
  const dayLabel = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale === "ur" ? "ur-PK" : "ar-SA-u-nu-latn-ca-gregory", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-navy-700">{t("board.title")}</h1>
          <LiveRefresh label={t("board.live")} />
        </div>
        <nav className="flex items-center gap-1 bg-white p-1 shadow-sm">
          <Link href={`/board?date=${addDays(date, -1)}`} className="p-2 hover:bg-royal-50" aria-label={t("board.prev_day")}><Icon name="chevron_right" className="rtl:rotate-0 ltr:rotate-180" /></Link>
          <span className="min-w-44 px-2 text-center font-bold">{date === today ? `${t("board.today")} · ` : ""}{dayLabel}</span>
          <Link href={`/board?date=${addDays(date, 1)}`} className="p-2 hover:bg-royal-50" aria-label={t("board.next_day")}><Icon name="chevron_left" className="rtl:rotate-0 ltr:rotate-180" /></Link>
          {date !== today && <Link href="/board" className="px-3 py-2 text-sm font-bold text-royal-600">{t("board.today")}</Link>}
        </nav>
        <div className="flex gap-2">
          {failed.length > 0 && (
            <Link href="/board/failed" className="flex h-10 items-center gap-2 bg-bad-50 px-4 text-sm font-bold text-bad-600">
              <Icon name="assignment_late" />{t("nav.failed")} ({failed.length})
            </Link>
          )}
          <Link href="/board/new" className="flex h-10 items-center gap-2 bg-royal-600 px-4 text-sm font-bold text-white hover:bg-royal-700">
            <Icon name="add" />{t("nav.new_order")}
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {counts.map(([s, n]) => (
          <span key={s} className="flex items-center gap-2 bg-white px-3 py-2 shadow-sm">
            <StatusChip status={s} t={t} /><b className="font-[family-name:var(--font-barlow)] text-lg">{n}</b>
          </span>
        ))}
      </div>

      {lanes.length === 0 ? (
        <p className="bg-white p-10 text-center text-ink-500 shadow-sm">{t("board.empty")}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {lanes.map((lane) => (
            <section key={lane.key} className="border-t-4 border-royal-600 bg-white shadow-sm">
              <header className="flex items-center justify-between bg-mist-100 px-4 py-3">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-700">
                  <Icon name={lane.external ? "local_shipping" : "person"} />{lane.label}
                </h2>
                <span className="text-sm text-ink-500">{t("board.orders_n", { n: lane.orders.length })}</span>
              </header>
              <ol className="divide-y divide-mist-200">
                {lane.orders.map((o, i) => (
                  <li key={o.id} className="p-4" data-testid="order-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center bg-navy-700 font-[family-name:var(--font-barlow)] text-sm font-bold text-white">{o.stop_seq ?? i + 1}</span>
                        <div>
                          <div className="font-bold">{o.branch?.customer?.name} — {o.branch?.name}</div>
                          <div className="mt-1 text-xs text-ink-500">
                            {t("board.rep")}: {o.rep?.name} · {t("board.po")}: <span dir="ltr">{o.po_number}</span>
                          </div>
                          {o.notes && <div className="mt-1 text-xs text-warn-600">{o.notes}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusChip status={o.status} t={t} />
                        <Age since={o.status_changed_at} t={t} now={now} />
                      </div>
                    </div>
                    <OrderCardActions id={o.id} status={o.status} external={o.external} reasons={reasonOpts} labels={cardLabels} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write the failed-orders files**

`ops/app/(app)/board/failed/actions.ts`:
```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { isIsoDate } from "@/lib/time";
import type { ActionState } from "../../admin/users/actions";

export async function rescheduleAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const date = String(fd.get("delivery_date") ?? "");
  const driver = String(fd.get("driver") ?? "");
  if (!isIsoDate(date) || !driver) return { error: "order.error_required" };
  const external = driver === "external";
  const meta = { delivery_date: date, external, ...(external ? {} : { driver_id: driver }) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: "new", p_meta: meta });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board");
  revalidatePath("/board/failed");
  return { ok: true };
}

export async function cancelFailedAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "sales"]);
  const note = String(fd.get("note") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: "cancelled", p_meta: note ? { note } : {} });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/board/failed");
  return { ok: true };
}
```

`ops/app/(app)/board/failed/FailedRow.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { cancelFailedAction, rescheduleAction } from "./actions";
import type { ActionState } from "../../admin/users/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

export function FailedActions({ id, defaultDate, drivers, labels }: {
  id: string; defaultDate: string; drivers: { user_id: string; full_name: string }[];
  labels: Record<"reschedule" | "cancel" | "date" | "driver" | "external" | "note" | "choose", string> & { errors: Record<string, string> };
}) {
  const [rs, rsAction, rsPending] = useActionState<ActionState, FormData>(rescheduleAction, {});
  const [cs, csAction, csPending] = useActionState<ActionState, FormData>(cancelFailedAction, {});
  return (
    <div className="flex flex-col gap-3">
      <form action={rsAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="flex flex-col gap-1 text-xs">{labels.date}
          <input type="date" name="delivery_date" defaultValue={defaultDate} required dir="ltr" className="h-9 border border-mist-300 px-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs">{labels.driver}
          <select name="driver" required defaultValue="" className="h-9 border border-mist-300 bg-white px-2 text-sm">
            <option value="" disabled>{labels.choose}</option>
            {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.full_name}</option>)}
            <option value="external">{labels.external}</option>
          </select>
        </label>
        <Button type="submit" disabled={rsPending} className="!h-9">{labels.reschedule}</Button>
      </form>
      <form action={csAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input name="note" placeholder={labels.note} className="h-9 border border-mist-300 px-2 text-sm" />
        <Button type="submit" variant="ghost" disabled={csPending} className="!h-9 text-bad-600">{labels.cancel}</Button>
      </form>
      <FormMessage kind="error">{(rs.error && labels.errors[rs.error]) || (cs.error && labels.errors[cs.error]) || null}</FormMessage>
    </div>
  );
}
```

`ops/app/(app)/board/failed/page.tsx`:
```tsx
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getActiveDrivers, getFailedOrders, getReasons } from "@/lib/orders/queries";
import { addDays, riyadhToday } from "@/lib/time";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { FailedActions } from "./FailedRow";

export default async function FailedPage() {
  await requireRole(["admin", "sales"]);
  const { t, locale } = await getT();
  const [failed, drivers, reasons] = await Promise.all([getFailedOrders(), getActiveDrivers(), getReasons()]);
  const reasonById = new Map(reasons.map((r) => [r.id, r]));
  const tomorrow = addDays(riyadhToday(), 1);
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-SA-u-nu-latn-ca-gregory", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  const labels = {
    reschedule: t("failed.reschedule"), cancel: t("failed.cancel"), date: t("order.date"), driver: t("order.driver"),
    external: t("board.external"), note: t("board.note"), choose: t("order.choose"),
    errors: { "order.error_required": t("order.error_required"), "order.error_transition": t("order.error_transition"),
      "order.error_driver": t("order.error_driver"), "common.error_generic": t("common.error_generic") },
  };
  return (
    <Card title={t("failed.title")} eyebrow="Not delivered">
      {failed.length === 0 ? (
        <p className="py-10 text-center text-ink-500">{t("failed.empty")}</p>
      ) : (
        <ul className="divide-y divide-mist-200">
          {failed.map((o) => {
            const r = o.reason_id ? reasonById.get(o.reason_id) : undefined;
            const label = r ? (locale === "en" ? r.label_en : locale === "ur" ? r.label_ur : r.label_ar) : t("failed.no_reason");
            return (
              <li key={o.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_auto]" data-testid="failed-row">
                <div>
                  <div className="text-lg font-bold">{o.branch?.customer?.name} — {o.branch?.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">
                    <span className="flex items-center gap-1 font-bold text-bad-600"><Icon name={r?.icon ?? "help"} />{label}</span>
                    <span>{t("board.po")}: <span dir="ltr">{o.po_number}</span></span>
                    <span dir="ltr">{fmt.format(new Date(o.failed_at))}</span>
                  </div>
                  {o.note && <p className="mt-2 bg-mist-50 p-2 text-sm">{o.note}</p>}
                </div>
                <FailedActions id={o.id} defaultDate={tomorrow} drivers={drivers} labels={labels} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
```

- [ ] **Step 5: Write the warehouse files**

`ops/app/(app)/warehouse/actions.ts`:
```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import type { ActionState } from "../admin/users/actions";

export async function setReadyAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin", "warehouse"]);
  const to = fd.get("to") === "new" ? "new" : "ready";
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order", { p_order_id: String(fd.get("id")), p_to: to, p_meta: {} });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/warehouse");
  return { ok: true };
}
```

`ops/app/(app)/warehouse/ReadyButton.tsx`:
```tsx
"use client";
import { useActionState, useEffect, useState } from "react";
import { setReadyAction } from "./actions";
import type { ActionState } from "../admin/users/actions";
import { Icon } from "@/components/ui/Icon";

const UNDO_MS = 5 * 60 * 1000;

export function ReadyButton({ id, status, readyAt, labels }: {
  id: string; status: "new" | "ready" | string; readyAt: string | null;
  labels: { ready: string; done: string; undo: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setReadyAction, {});
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(i); }, []);
  const canUndo = status === "ready" && readyAt !== null && now - new Date(readyAt).getTime() < UNDO_MS;
  return (
    <div className="flex flex-col items-end gap-1">
      {status === "new" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="ready" />
          <button disabled={pending} className="flex h-14 min-w-36 items-center justify-center gap-2 bg-ok-600 px-6 text-lg font-extrabold text-white disabled:opacity-60">
            <Icon name="check" className="text-2xl" />{labels.ready}
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex h-14 items-center gap-2 bg-ok-50 px-5 text-lg font-extrabold text-ok-600"><Icon name="done_all" />{labels.done}</span>
          {canUndo && (
            <form action={action}>
              <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value="new" />
              <button disabled={pending} className="h-14 px-4 text-sm font-bold text-ink-500 underline">{labels.undo}</button>
            </form>
          )}
        </div>
      )}
      {state.error && <span role="alert" className="text-xs font-bold text-bad-600">{labels.errors[state.error] ?? labels.errors["common.error_generic"]}</span>}
    </div>
  );
}
```

`ops/app/(app)/warehouse/page.tsx` (replaces the Plan 1 shell):
```tsx
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getActiveDrivers, getOrdersForDate } from "@/lib/orders/queries";
import { groupByDriver } from "@/lib/orders/group";
import { riyadhToday } from "@/lib/time";
import { LiveRefresh } from "@/components/orders/LiveRefresh";
import { Icon } from "@/components/ui/Icon";
import { ReadyButton } from "./ReadyButton";

export default async function WarehousePage() {
  await requireRole(["admin", "warehouse"]);
  const { t } = await getT();
  const [orders, drivers] = await Promise.all([getOrdersForDate(riyadhToday()), getActiveDrivers()]);
  const todo = orders.filter((o) => o.status === "new" || o.status === "ready");
  const lanes = groupByDriver(todo, drivers, t("board.external"));
  const labels = { ready: t("wh.ready"), done: t("wh.done"), undo: t("wh.undo"),
    errors: { "wh.error_undo": t("wh.error_undo"), "order.error_transition": t("order.error_transition"), "common.error_generic": t("common.error_generic") } };
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-navy-700">{t("wh.title")}</h1>
        <LiveRefresh label={t("board.live")} />
      </header>
      {lanes.length === 0 ? (
        <p className="bg-white p-10 text-center text-lg text-ink-500 shadow-sm">{t("wh.empty")}</p>
      ) : (
        lanes.map((lane) => (
          <section key={lane.key} className="border-t-4 border-royal-600 bg-white shadow-sm">
            <h2 className="flex items-center gap-2 bg-mist-100 px-4 py-3 text-xl font-extrabold text-navy-700">
              <Icon name={lane.external ? "local_shipping" : "person"} />{lane.label}
            </h2>
            <ul className="divide-y divide-mist-200">
              {lane.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 p-4" data-testid="wh-row">
                  <div>
                    <div className="text-lg font-bold">{o.branch?.customer?.name} — {o.branch?.name}</div>
                    <div className="text-sm text-ink-500">{t("board.po")}: <span dir="ltr">{o.po_number}</span></div>
                  </div>
                  <ReadyButton id={o.id} status={o.status} readyAt={o.ready_at} labels={labels} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 6: Type-check, lint, unit tests, build**

Run: `cd ops && npx tsc --noEmit && npx eslint . && npx vitest run && npx next build`
Expected: everything passes, and the route list includes `/board`, `/board/new`, `/board/failed`, `/customers` and `/warehouse`.

- [ ] **Step 7: Commit** with message `feat(ops): add live board, not-delivered list and warehouse ready screen`.

---

### Task 8: End-to-end — sales → warehouse → external close → reschedule

**Files:**
- Create: `ops/tests/e2e/orders.spec.ts`

**Interfaces:**
- Consumes: test accounts created through SQL (`_create_user`, run as `postgres` via MCP) with `must_change_password = false`: `e2e-sales` (sales), `e2e-wh` (warehouse) and `e2e-driver` (driver), plus the sales rep `E2E مندوب`. All of them, and all test data, are deleted afterwards.

- [ ] **Step 1: Create the test accounts.** Generate one random password with `openssl rand -base64 12` and keep it in the scratchpad only. Then run, via `execute_sql`:

```sql
select public._create_user('e2e-sales','E2E مبيعات','sales','ar','<pw>',false);
select public._create_user('e2e-wh','E2E مستودع','warehouse','ar','<pw>',false);
select public._create_user('e2e-driver','E2E سائق','driver','ar','<pw>',false);
insert into public.sales_reps(name) values ('E2E مندوب') on conflict do nothing;
```

- [ ] **Step 2: Write `ops/tests/e2e/orders.spec.ts`**

```ts
import { expect, test, type Page } from "@playwright/test";

const PW = process.env.E2E_PASS!;
const SHOTS = process.env.E2E_SHOTS_DIR;
const tag = Date.now().toString().slice(-5);
const CUSTOMER = `E2E متجر ${tag}`;

async function login(page: Page, user: string) {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(PW);
  await page.locator("form", { has: page.locator('input[name="password"]') }).locator('button[type="submit"]').click();
}

test("sales creates orders, warehouse readies them, sales closes and reschedules", async ({ browser }) => {
  const sales = await (await browser.newContext()).newPage();
  await login(sales, "e2e-sales");
  await expect(sales).toHaveURL(/\/board/);

  // customer + branch
  await sales.goto("/customers");
  await sales.locator('form:has(button:text("إضافة عميل")) input[name="name"]').fill(CUSTOMER);
  await sales.getByRole("button", { name: "إضافة عميل" }).click();
  await expect(sales.getByText(CUSTOMER).first()).toBeVisible();
  const branchForm = sales.locator("form", { has: sales.locator('input[name="location"]') });
  await branchForm.locator('select[name="customer_id"]').selectOption({ label: CUSTOMER });
  await branchForm.locator('input[name="name"]').fill("الفرع الرئيسي");
  await branchForm.locator('input[name="location"]').fill("24.7136, 46.6753");
  await branchForm.getByRole("button", { name: "إضافة فرع" }).click();
  await expect(branchForm.getByText("تم الحفظ.")).toBeVisible();

  // two orders: driver + external
  for (const [po, driver] of [[`PO-${tag}-1`, "E2E سائق"], [`PO-${tag}-2`, "سيارة خارجية"]] as const) {
    await sales.goto("/board/new");
    await sales.getByRole("combobox").fill(`متجر ${tag}`);
    await sales.getByRole("option").first().click();
    await sales.locator('select[name="sales_rep_id"]').selectOption({ label: "E2E مندوب" });
    await sales.locator('input[name="po_number"]').fill(po);
    await sales.locator('select[name="driver"]').selectOption({ label: driver });
    await sales.getByRole("button", { name: "حفظ وإضافة طلب آخر" }).click();
    await expect(sales.getByText("تم حفظ الطلب.")).toBeVisible();
  }
  if (SHOTS) await sales.screenshot({ path: `${SHOTS}/p2-01-new-order.png`, fullPage: true });

  await sales.goto("/board");
  await expect(sales.getByTestId("order-card").filter({ hasText: `PO-${tag}-1` })).toContainText("عند المستودع");

  // warehouse readies both
  const wh = await (await browser.newContext()).newPage();
  await login(wh, "e2e-wh");
  await expect(wh).toHaveURL(/\/warehouse/);
  for (const n of [1, 2]) {
    const row = wh.getByTestId("wh-row").filter({ hasText: `PO-${tag}-${n}` });
    await row.getByRole("button", { name: "جاهز" }).click();
    await expect(row.getByRole("button", { name: "تراجع" })).toBeVisible();
  }
  if (SHOTS) await wh.screenshot({ path: `${SHOTS}/p2-02-warehouse.png`, fullPage: true });

  // sales board updates live (realtime or 60s fallback) — reload to be deterministic
  await sales.reload();
  const card1 = sales.getByTestId("order-card").filter({ hasText: `PO-${tag}-1` });
  await expect(card1).toContainText("جاهز");
  if (SHOTS) await sales.screenshot({ path: `${SHOTS}/p2-03-board.png`, fullPage: true });

  // external order fails with reason
  const card2 = sales.getByTestId("order-card").filter({ hasText: `PO-${tag}-2` });
  await card2.getByRole("button", { name: "لم يتم التسليم" }).click();
  await card2.getByText("المحل مقفل").click();
  await card2.locator('input[name="note"]').fill("مقفل وقت الظهر");
  await card2.getByRole("button", { name: "تأكيد" }).click();
  await expect(card2.locator("form")).toHaveCount(0);

  // reschedule from the not-delivered list
  await sales.goto("/board/failed");
  const row = sales.getByTestId("failed-row").filter({ hasText: `PO-${tag}-2` });
  await expect(row).toContainText("المحل مقفل");
  await expect(row).toContainText("مقفل وقت الظهر");
  if (SHOTS) await sales.screenshot({ path: `${SHOTS}/p2-04-failed.png`, fullPage: true });
  await row.locator('select[name="driver"]').selectOption({ label: "E2E سائق" });
  await row.getByRole("button", { name: "إعادة الجدولة" }).click();
  await expect(sales.getByTestId("failed-row").filter({ hasText: `PO-${tag}-2` })).toHaveCount(0);
});
```

- [ ] **Step 3: Run it**

Run: `cd ops && npx next build && E2E_PASS='<pw>' E2E_SHOTS_DIR=<scratchpad> npx playwright test tests/e2e/orders.spec.ts --trace off`
Expected: 1 passed. Review all four screenshots.

- [ ] **Step 4: Clean up the test data** via `execute_sql`:

```sql
delete from public.orders where po_number like 'PO-%' and branch_id in (select b.id from public.branches b join public.customers c on c.id = b.customer_id where c.name like 'E2E متجر%');
delete from public.branches where customer_id in (select id from public.customers where name like 'E2E متجر%');
delete from public.customers where name like 'E2E متجر%';
delete from public.sales_reps where name = 'E2E مندوب';
delete from auth.users where email in ('e2e-sales@users.ops.local','e2e-wh@users.ops.local','e2e-driver@users.ops.local');
delete from public.login_attempts where username like 'e2e-%';
```

Note: `order_events` rows cascade with their orders. `profiles` rows cascade with `auth.users`, but `orders.created_by` references `profiles`, so the orders must be deleted first, as above.

- [ ] **Step 5: Run all the checks, then commit, push and deploy to production.** The deploy uses the Vercel MCP `create_deployment` with the pushed SHA. Commit with message `test(ops): end-to-end orders, warehouse and reschedule flow`.

## Done criteria for Plan 2

- Sales enters an order in under 30 seconds with Arabic-tolerant branch search, and with "Save & add another".
- The board groups the day's orders by driver (external last), shows status and time in status, updates live, and navigates by day.
- The warehouse sees today's orders, taps Ready, and can undo within 5 minutes.
- External orders are closed by sales. Failed orders show their reason and note, and can be rescheduled or cancelled.
- SQL, unit and e2e tests pass. The new version is deployed to https://al-sakhrah-ops.vercel.app.
