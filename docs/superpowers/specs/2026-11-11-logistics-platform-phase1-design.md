# Al-Sakhrah Logistics Platform — Phase 1 Design

**Date:** 2026-11-11
**Status:** Approved in brainstorming (sections 1–3). Section 4 (technical) follows the approved approach ("one web app + thin Android wrapper").

## 1. Problem

Every morning sales enters the day's store orders, the warehouse keeper prepares them, and drivers leave with 2–4 orders each, choosing their own route. Nobody in the office can see where a driver is, when a store will be reached, or which orders failed until the driver returns. Order hand-offs happen on paper.

Example day (Riyadh warehouse, morning): Aref, 4 stops (Hussain Top Exit 6, Hussain Top Al-Rabwah, Al-Bait Al-Souri, Top Al-Aila Al-Nahda); Naeem, 3 stops; external car, 1 stop. Each line also names the sales rep who took the order (Majd, Nasser, Abu Abdullah).

## 2. Scope

**In phase 1**
- Username + password login with four roles: admin, sales, warehouse, driver.
- Per-user UI language: Arabic (RTL), English (LTR), Urdu (RTL).
- Sales enters orders and assigns the driver; warehouse marks orders ready; ready orders appear on the driver's tablet immediately.
- Driver tablet app (Android): route-optimised stop list, Google Maps navigation hand-off, proof of delivery (photo of the stamped PO), or not-delivered with reason.
- Live map of drivers with per-stop ETAs.
- Dashboard with counts, timings, breakdowns, order timeline and Excel export.

**Out of phase 1:** customer portal, pricing and invoicing (they stay with the accountant), product catalogue and line items, Zid integration, more than one warehouse, automatic splitting of orders between drivers.

## 3. Users and roles

| Role | Device | Can do |
|---|---|---|
| Admin | Browser | Everything sales can do, plus manage users, sales reps, warehouse location and failure reasons |
| Sales | Browser | Create and edit orders, assign driver or external car, today's board, live map, reschedule or cancel failed orders, manage customers and branches, dashboard |
| Warehouse | Browser | See today's orders by driver; mark ready (undo within 5 minutes) |
| Driver | Android tablet | See own orders, start and end trips, navigate, deliver, mark not delivered |

Sales reps are data only (a name on each order). They have no login.

## 4. Order lifecycle

```
new ──(warehouse: Ready)──▶ ready ──(driver: Start trip)──▶ on_the_way
                                                              │
                                     ┌────────────────────────┴───────────┐
                                     ▼                                    ▼
                                 delivered                             failed
                                                                          │
                                         sales: Reschedule ──▶ new (new date/driver)
                                         sales: Cancel     ──▶ cancelled
```

- `delivery_date` defaults to today.
- The driver is chosen by sales when the order is entered, and can be changed while the order is `new` or `ready`.
- **External car:** the order is marked `external = true` with no driver. After it is ready, sales moves it straight from `ready` to `delivered` or `failed` by hand. There is no tracking, and a proof photo is optional because sales may not have one.
- Every transition writes an `order_events` row (actor, from, to, time, metadata). This row is the order's timeline.
- The warehouse can undo `ready` back to `new` within 5 minutes, but only if no trip has started.

## 5. Trips and routing

- A **trip** belongs to one driver and starts when the driver taps **Start trip**. It contains every `ready` order assigned to that driver at that moment. A driver can run several trips a day. Orders that become ready after a trip has started wait for the next trip.
- On start, the server calls the Google **Routes API** `computeRoutes` with `optimizeWaypointOrder=true`. The origin is the driver's current position, falling back to the warehouse. The intermediate waypoints are the branch locations, and the destination is the warehouse. The server stores the optimised `stop_seq`, a per-leg duration (giving each stop's ETA) and the encoded polyline.
- The driver or sales can reorder the remaining stops by dragging them. ETAs are then recomputed without re-optimising.
- **ETA refresh:** at most every 2 minutes during an active trip, triggered by location updates, the server recomputes the remaining legs from the latest position.
- **Trip end:** the driver taps **End trip** after the last stop. As a safety net, the trip also ends automatically when the driver comes within 200 m of the warehouse with no open stops, or 12 hours after it started.
- Limit: 25 intermediate waypoints per request, far above the expected 3–5 stops.

## 6. Proof of delivery

- **Delivered:** the driver must take a camera photo of the stamped purchase order. The system stores the photo, the time and the GPS fix. If the fix is more than 300 m from the branch location, the order is flagged `far_from_store` for sales to review.
- **Not delivered:** the driver picks a reason (defaults: Closed, Refused, Wrong location, Payment issue, Other; admin can edit the list). A note and photo are optional. The order goes to the sales "Not delivered" list.

## 7. Screens

### Sales, and admin (browser)
1. **Today's board (home).** Orders grouped by driver and external car, in stop order. Each order shows the branch, sales rep, PO number, a status chip, the time spent in that status and the ETA. The board updates live.
2. **New order form, target under 30 seconds.** Branch search (typeahead over customer + branch name). "Add branch" opens a Google Places search and saves the place ID and coordinates. Then sales rep select, PO number, optional PO photo, driver or external car select, date (today), and notes. A "Save & add another" button speeds up batch entry.
3. **Live map.** Driver markers, each with a "last update N min ago" label, route polylines, and stop markers coloured by status. A side panel lists each driver's stops and ETAs.
4. **Not delivered.** Each failed order with its reason, note and photo, and actions to Reschedule (date and driver) or Cancel (note required).
5. **Customers and branches.** Create and edit; each branch has a name, phone and map location.
6. **Dashboard.** Described below.
7. **Admin only:** users (create, reset password, deactivate, set role and language), sales reps, warehouse location, failure reasons.

### Warehouse (browser)
- Today's orders grouped by driver, each with a large **Ready ✓** button, and an undo toast that lasts 5 minutes.

### Driver (Android tablet)
- **Home:** order cards in stop order, each with branch, area, ETA and status. Orders that are not yet ready are greyed out with "Preparing". A large **Start trip** button is shown when the driver has ready orders and no active trip.
- **Stop actions:** 🧭 Navigate (opens a Google Maps intent to the branch coordinates), ✅ Delivered (camera, then confirm), ❌ Not delivered (reason icons, optional note or photo).
- **Trip complete:** "Return to warehouse" with an **End trip** button.
- Banners for low battery, location off and offline mode.
- The UI is icon-first with large touch targets, because drivers may have limited literacy in the UI language.

## 8. Dashboard

The date range defaults to today, with presets for yesterday, this week and this month, plus a custom range. It can be filtered by driver, sales rep and customer.
- **KPI tiles:** total orders, waiting for warehouse, ready, on the way, delivered, not delivered, delivery success % (delivered ÷ (delivered + failed)).
- **Timings:** average time from entered to ready, and average time from ready to delivered.
- **Breakdowns:** per driver (orders, delivered, failed, trips, km driven), per sales rep (orders, success %), per customer (orders, failures), and failure reasons.
- **Order table:** filterable. Each row opens a timeline drawer with the proof photo.
- **Export:** the current filtered table can be exported to `.xlsx`.

## 9. Branding

Taken from the company profile and logo guideline, not from the current marketing site.
- **Colours:** navy `#003087` (Pantone 287 C), royal blue `#0047BB` (Pantone 2145 C), page background `#F1F4F9`, white cards, and status colours (green, red, amber) tuned to sit with the blues.
- **Fonts:** Almarai for Arabic and Urdu UI text (Urdu falls back to Noto Nastaliq Urdu if Almarai lacks glyphs), and Barlow for Latin text and numbers. Both come from Google Fonts. The logo's own fonts (29LT Zawi, DIN Next) appear only in the logo artwork.
- **Icons:** Material Symbols Outlined (light).
- **Shape:** square-cornered cards with a blue top rule, diagonal corner accents, and Latin section labels in spaced caps.
- **Logo:** the vector "S" logo, extracted from the supplied PDF to SVG.

## 10. Technical design

### 10.1 Repository layout
The new app lives in `ops/` inside this repository. It is its own Next.js project and its own Vercel project (root directory `ops/`), on a private subdomain. The public marketing site at the repo root is left untouched.

```
ops/
  app/                 Next.js App Router (route groups per role)
  components/          UI building blocks (one purpose per file)
  lib/
    auth/              session helpers, role guards
    orders/            status machine, order queries and actions
    trips/             trip start/end, routing client, ETA refresh
    maps/              Google Routes / Places server clients
    i18n/              dictionaries (ar, en, ur) + direction helper
    db/                Supabase clients (server, browser, service role)
  supabase/migrations/ SQL schema, RLS policies, seed
  android/             Capacitor Android wrapper (driver app)
  tests/               unit (Vitest) + e2e (Playwright)
```

### 10.2 Stack
- **Next.js 16** with the App Router, TypeScript and Tailwind CSS v4. Before writing code, read the relevant guides in `node_modules/next/dist/docs/` (per AGENTS.md); for example, request interception is done in `proxy.ts` in this version.
- **Supabase:** Postgres, Auth, Storage (private bucket `proofs`, served through short-lived signed URLs) and Realtime (orders, trips, latest driver positions).
- **Google Maps Platform:** Maps JavaScript API for the live map, Places API (New) for adding branches, and Routes API for optimisation and ETAs. The browser uses a referrer-restricted key; the Routes API is called only from the server with a separate server key.
- **Driver app:** Capacitor Android shell that loads the deployed `/driver` routes. It adds a background-geolocation plugin with a foreground service notification, and the Camera plugin.

### 10.3 Data model (Postgres)
- `warehouses` (id, name, lat, lng). Seeded with Riyadh.
- `customers` (id, name).
- `branches` (id, customer_id, name, phone, google_place_id, lat, lng, address_text).
- `sales_reps` (id, name, active).
- `profiles` (user_id → auth.users, username unique, full_name, role enum `admin|sales|warehouse|driver`, locale enum `ar|en|ur`, active).
- `orders` (id, branch_id, sales_rep_id, po_number, po_photo_path, driver_id null, external bool, delivery_date, status enum `new|ready|on_the_way|delivered|failed|cancelled`, notes, trip_id null, stop_seq null, eta null, ready_at, delivered_at, created_by, created_at, updated_at).
  - Check constraint: exactly one of `driver_id` set or `external = true`.
- `trips` (id, driver_id, warehouse_id, started_at, ended_at, end_reason, polyline, distance_m).
- `proofs` (id, order_id, outcome `delivered|failed`, reason_id null, note, photo_path, lat, lng, accuracy_m, far_from_store bool, recorded_at, synced_at).
- `failure_reasons` (id, code, label_ar, label_en, label_ur, icon, active, sort).
- `driver_locations` (id, trip_id, driver_id, lat, lng, accuracy_m, speed, recorded_at). Indexed on (driver_id, recorded_at desc).
- `order_events` (id, order_id, actor_id, from_status, to_status, meta jsonb, created_at).

Status changes go through a single Postgres function, `transition_order(order_id, to_status, meta)`. It enforces the state machine and the role allowed for each transition, and writes `order_events` in the same transaction.

### 10.4 Authentication and security
- **Login:** username and password. Supabase Auth requires an email, so each username maps to an internal address `<username>@users.ops.local`, which is never shown to users. Only admins create accounts, through a server action that uses the service-role key. Public sign-up is disabled.
- **Passwords:** minimum 8 characters. Admin reset sets a temporary password that must be changed at the next login.
- **Row Level Security on every table:**
  - Drivers can read only their own orders, trips and branches on their orders, and insert only their own locations and proofs.
  - The warehouse role can read today's orders and can only transition `new` ↔ `ready`.
  - Sales and admin can read everything; only admin can write `profiles`, `sales_reps`, `failure_reasons` and `warehouses`.
- **Route guards:** `proxy.ts` redirects unauthenticated users to `/login`. Every layout checks the role server-side, and every server action re-checks the role before acting, so nothing relies on hidden UI alone.
- **Secrets:** the service-role key, the Routes key and the Supabase JWT secret are server-only environment variables, never exposed through `NEXT_PUBLIC_`.
- **Photos:** stored in a private bucket and viewed only through signed URLs valid for 10 minutes.
- **Login rate limiting:** Supabase Auth's built-in limits, plus a lockout of 5 failed attempts per username per 15 minutes.

### 10.5 Internationalisation
- Dictionaries are JSON files, `lib/i18n/{ar,en,ur}.json`, and every UI string goes through `t(key)`.
- The user's locale comes from `profiles.locale` and sets `<html lang dir>`. The login page has a language switcher stored in a cookie.
- Store names, notes and addresses are shown as entered. Numbers and times are formatted with `Intl` for the user's locale; Latin digits are used everywhere for consistency with PO numbers.

### 10.6 Realtime and offline
- Office screens subscribe to Realtime changes on `orders` and `trips`, and to a `driver_positions` broadcast channel. There is no polling.
- The driver app sends one location every 30 seconds during a trip.
- **Offline queue:** while offline, locations and proofs (with their photo blobs) are kept in IndexedDB and replayed in order when the tablet reconnects. Each item has a client-generated UUID, so replays are idempotent.
- The office map shows "last update N min ago" for each driver and marks the driver stale after 3 minutes.

### 10.7 Error handling
- **Routes API failure:** the trip still starts. Stops keep the order sales entered, with no ETAs, and a banner on the board says "Route optimisation unavailable". The server retries on the next location update.
- **Places API failure:** sales can paste a Google Maps link instead. The server parses the coordinates from it, and if parsing fails it asks for the link again.
- **Location permission denied, or GPS off:** a blocking screen on the driver app explains how to turn it on. The trip cannot start without location.
- **Photo upload failure:** the photo stays in the offline queue, and the order shows "Delivered (uploading…)" until it syncs.
- **Concurrent edits:** transitions are checked in `transition_order`, so an invalid transition (for example, cancelling an order that was already delivered) returns a translated error message.

### 10.8 Testing
- **Unit (Vitest):** order state machine, role permissions matrix, ETA arithmetic, Google Maps link parsing, i18n key coverage (every key exists in ar, en and ur).
- **Database:** SQL tests run against a local or branch Supabase. They check that each role's RLS allows and denies the right reads and writes, and that `transition_order` rejects illegal moves.
- **End-to-end (Playwright):** the full happy path with seeded data. Sales creates an order, the warehouse marks it ready, the driver (in a mobile viewport with mocked geolocation) starts a trip and delivers with a fixture photo, and the dashboard counts update. A second test covers failed → reschedule.
- **Manual on device:** install the APK on one tablet and check background tracking with the screen locked for 10 minutes and offline replay in airplane mode.

### 10.9 Deployment
- **Vercel project** `al-sakhrah-ops` with root `ops/`. Preview deployments are used for review.
- **Supabase project** in a Middle East region if available, otherwise the closest EU region.
- **Android:** the APK is built with Gradle and installed on the tablets by sideloading.

## 11. Prerequisites from the business
1. A Google Cloud project with billing enabled, and the Maps JavaScript, Places (New) and Routes APIs turned on. Two API keys are needed: a browser key (referrer-restricted) and a server key.
2. A Supabase project. It can be created through the connected Supabase account once the user approves the plan and cost.
3. A subdomain for the ops app, for example `ops.<company-domain>`.
4. The list of initial users (usernames, roles, languages), the sales reps, and the Riyadh warehouse location.
5. The Android tablets for testing.

## 12. Success criteria
- An order can be entered in under 30 seconds.
- Sales can answer "where is Aref and when does he reach Hussain Top?" from the board without phoning the driver.
- 100% of delivered orders have a stamped-PO photo.
- Failed orders are visible to sales within one minute of the driver recording them.
- The dashboard shows a full day's figures with no manual counting.
