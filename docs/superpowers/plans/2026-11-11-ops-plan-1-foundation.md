# Al-Sakhrah Ops — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed-ready `ops/` Next.js app where an admin logs in with a username and password, manages user accounts, sales reps, failure reasons and the warehouse location, and every role lands on its own (still empty) home screen in its own language, all in the Al-Sakhrah brand.

**Architecture:** This is a separate Next.js 16 App Router project in `ops/`, backed by Supabase (Postgres, Auth). All privileged writes go through `security definer` Postgres functions that check the caller's role, and Row Level Security protects every table, so the app never holds a service-role key. Database rules are tested locally against a throwaway Postgres 16 cluster that has a small Supabase `auth` shim.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript 5, Tailwind CSS 4, @supabase/ssr 0.12, @supabase/supabase-js 2.119, Vitest 5, Playwright (pre-installed), Postgres 16 (local tests), Supabase (hosted).

**Spec:** `docs/superpowers/specs/2026-11-11-logistics-platform-phase1-design.md`

**Plan series:**
1. **Foundation** (this plan)
2. Orders workflow: board, order form, branches, warehouse, not-delivered
3. Driver app, trips, routing and live map
4. Dashboard and export
5. Android wrapper, background GPS, offline queue and deployment

## Global Constraints

- Next.js version: `16.2.9`, pinned to match the marketing site. Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/01-app/`. Middleware is called **`proxy.ts`** in this version and runs on Node.js. `cookies()` is async.
- Do not enable `cacheComponents`. Every page is per-user and dynamic.
- Locales: exactly `ar`, `en`, `ur`, with `ar` as the default. `ar` and `ur` are RTL; `en` is LTR.
- Every UI string goes through `t(key)`. Never hard-code visible text in components.
- Brand colours: navy `#003087`, royal `#0047BB`, background `#F1F4F9`. Fonts: Almarai (Arabic), Barlow (Latin and digits), Noto Naskh Arabic (Urdu fallback). Icons: Material Symbols Outlined, weight 300.
- Usernames match `^[a-z0-9._-]{3,32}$` and map to the auth email `<username>@users.ops.local`.
- Passwords are at least 8 characters. Accounts created or reset by an admin must change their password at the next login.
- Login lockout: 5 failed attempts per username within 15 minutes.
- Roles: `admin`, `sales`, `warehouse`, `driver`. Home routes: admin → `/admin/users`, sales → `/board`, warehouse → `/warehouse`, driver → `/driver`.
- The Supabase service-role key must never be used or stored by the app.
- The public marketing site at the repository root must not be modified.
- Commits end with the trailer lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01VZvvgvXcVCmbo3JTDyzQTX
  ```

## File Structure

```
ops/
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs,
  vitest.config.ts, .gitignore, .env.example
  proxy.ts                         session refresh + login redirect
  app/
    globals.css                    Tailwind import + brand @theme
    layout.tsx                     fonts, <html lang dir>, icon font
    page.tsx                       redirect to role home
    login/page.tsx, login/LoginForm.tsx, login/actions.ts
    account/password/page.tsx, account/password/PasswordForm.tsx, account/password/actions.ts
    (app)/layout.tsx               auth + role guard shell
    (app)/board/page.tsx           sales home shell (filled by plan 2)
    (app)/warehouse/page.tsx       warehouse home shell (plan 2)
    (app)/driver/page.tsx          driver home shell (plan 3)
    (app)/admin/users/page.tsx, CreateUserForm.tsx, UserRow.tsx, actions.ts
    (app)/admin/settings/page.tsx, RepsSection.tsx, ReasonsSection.tsx, WarehouseSection.tsx, actions.ts
    actions/locale.ts              set language (cookie + profile)
  components/
    brand/Logo.tsx                 inline <img> of the SVG logo
    ui/Icon.tsx, ui/Button.tsx, ui/Card.tsx, ui/Field.tsx, ui/FormMessage.tsx
    shell/AppHeader.tsx, shell/LocaleSwitcher.tsx
  lib/
    i18n/index.ts, i18n/en.ts, i18n/ar.ts, i18n/ur.ts, i18n/server.ts
    auth/username.ts, auth/roles.ts, auth/session.ts
    orders/status.ts               transition rules (mirrors SQL)
    maps/parseMapsLink.ts, maps/resolveMapsLink.ts
    db/server.ts, db/browser.ts, db/errors.ts, db/types.ts
  public/brand/logo.svg, public/brand/logo-mark.svg
  supabase/migrations/0001_schema.sql, 0002_order_functions.sql,
    0003_account_functions.sql, 0004_rls.sql, 0005_seed.sql
  supabase/tests/run.sh, shim.sql, helpers.sql,
    010_transition.test.sql, 020_rls.test.sql, 030_accounts.test.sql
  tests/unit/*.test.ts
  tests/e2e/admin.spec.ts, playwright.config.ts
```

---

### Task 1: Create the Supabase project

This task is an operations step with no code.

**Files:**
- Create: `ops/.env.local` (gitignored, created in Task 2's `.gitignore`)

**Interfaces:**
- Produces: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and a project ref used by Tasks 7 and 13.

- [ ] **Step 1: Check the cost and create the project.** Use the Supabase MCP tools against organisation `kzcpwalhgmsgthqmnfkn`. The project name is `al-sakhrah-ops`. Prefer region `me-central-1` if `create_project` accepts it; otherwise use `eu-central-1`. If the tools return a cost confirmation, show it to the user before confirming.
- [ ] **Step 2: Wait for the project to come up.** Poll `get_project` until the status is `ACTIVE_HEALTHY`.
- [ ] **Step 3: Read the public connection values.** Call `get_project_url` and `get_publishable_keys`. Use the key named `publishable` (format `sb_publishable_...`), or the legacy `anon` key if no publishable key exists.
- [ ] **Step 4: Check network access from the sandbox.**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://<ref>.supabase.co/auth/v1/health`
Expected: `200` or `401`. If the proxy refuses the host, call `get_environment`, then `update_environment` with `add_allowed_hosts: ["<ref>.supabase.co"]`, and retry.

- [ ] **Step 5: Ask the user to disable public sign-ups.** In the Supabase dashboard this is Authentication → Sign In / Providers → turn off "Allow new users to sign up". The app is safe even if this is left on, because a user without a `profiles` row has no role and RLS denies everything. Record the user's answer in the task notes.

---

### Task 2: Scaffold the `ops/` app with brand theme, logo and Vitest

**Files:**
- Create: `ops/package.json`, `ops/tsconfig.json`, `ops/next.config.ts`, `ops/postcss.config.mjs`, `ops/eslint.config.mjs`, `ops/vitest.config.ts`, `ops/.gitignore`, `ops/.env.example`
- Create: `ops/app/globals.css`, `ops/app/layout.tsx`, `ops/app/page.tsx` (temporary, replaced in Task 9)
- Create: `ops/components/ui/Icon.tsx`, `ops/components/ui/Button.tsx`, `ops/components/ui/Card.tsx`, `ops/components/ui/Field.tsx`, `ops/components/ui/FormMessage.tsx`, `ops/components/brand/Logo.tsx`
- Create: `ops/public/brand/logo.svg`, `ops/public/brand/logo-mark.svg`
- Test: `ops/tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: Tailwind colour utilities `navy-{900,800,700}`, `royal-{700,600,500,100,50}`, `mist-{50,100,200,300}`, `ink-{900,700,500}`, `ok-{600,50}`, `bad-{600,50}`, `warn-{600,50}`. UI components `<Icon name>`, `<Button variant="primary"|"secondary"|"danger"|"ghost" size="md"|"lg">`, `<Card title? eyebrow?>`, `<Field label name ...input props>`, `<FormMessage kind="error"|"success">`, and `<Logo variant="full"|"mark" className>`.

- [ ] **Step 1: Write `ops/package.json`**

```json
{
  "name": "al-sakhrah-ops",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3200",
    "build": "next build",
    "start": "next start -p 3200",
    "lint": "eslint",
    "test": "vitest run",
    "test:sql": "bash supabase/tests/run.sh",
    "test:e2e": "playwright test --trace off"
  },
  "dependencies": {
    "@supabase/ssr": "^0.12.7",
    "@supabase/supabase-js": "^2.119.0",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^5.1.0"
  }
}
```

- [ ] **Step 2: Write the config files**

`ops/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "android"]
}
```

`ops/next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
```

`ops/postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`ops/eslint.config.mjs`:
```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "android/**", "next-env.d.ts"]),
]);
```

`ops/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`ops/.gitignore`:
```
node_modules/
.next/
.env*.local
test-results/
playwright-report/
next-env.d.ts
```

`ops/.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Before writing the ESLint config, compare it with the root `eslint.config.mjs`. If the root uses different import paths for `eslint-config-next`, copy the root's paths, because it is the known-working configuration for this Next.js version.

- [ ] **Step 3: Install the dependencies**

Run: `cd ops && npm install`
Expected: the command exits 0, and `node_modules/next/package.json` shows version `16.2.9`.

- [ ] **Step 4: Write the brand theme in `ops/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-navy-900: #001a4d;
  --color-navy-800: #00256b;
  --color-navy-700: #003087;
  --color-royal-700: #003a9c;
  --color-royal-600: #0047bb;
  --color-royal-500: #2a66d0;
  --color-royal-100: #dbe6fa;
  --color-royal-50: #eef3fc;
  --color-mist-50: #f1f4f9;
  --color-mist-100: #e6ebf3;
  --color-mist-200: #d3dbe8;
  --color-mist-300: #b4c0d4;
  --color-ink-900: #0f1b33;
  --color-ink-700: #33415f;
  --color-ink-500: #5d6b88;
  --color-ok-600: #13804a;
  --color-ok-50: #e8f6ee;
  --color-bad-600: #c4262e;
  --color-bad-50: #fdecee;
  --color-warn-600: #b25e09;
  --color-warn-50: #fff4e5;

  --font-sans: var(--font-barlow), var(--font-almarai), var(--font-naskh), system-ui, sans-serif;
}

:root:lang(ar) {
  --font-sans: var(--font-almarai), var(--font-barlow), system-ui, sans-serif;
}
:root:lang(ur) {
  --font-sans: var(--font-almarai), var(--font-naskh), var(--font-barlow), system-ui, sans-serif;
}

body {
  background: var(--color-mist-50);
  color: var(--color-ink-900);
  font-family: var(--font-sans);
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
  line-height: 1;
}

/* Diagonal corner accent from the company profile */
.corner-accent {
  position: relative;
  overflow: hidden;
}
.corner-accent::after {
  content: "";
  position: absolute;
  inset-inline-end: 0;
  top: 0;
  width: 56px;
  height: 56px;
  background: var(--color-royal-600);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}

/* Latin eyebrow labels in spaced caps, as in the profile */
.eyebrow {
  font-family: var(--font-barlow), sans-serif;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 600;
}
```

- [ ] **Step 5: Write `ops/app/layout.tsx`.** This is the version used until Task 6, which makes it read the user's locale.

```tsx
import type { Metadata } from "next";
import { Almarai, Barlow, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const almarai = Almarai({ subsets: ["arabic"], weight: ["300", "400", "700", "800"], variable: "--font-almarai" });
const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-barlow" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-naskh" });

export const metadata: Metadata = {
  title: "Al-Sakhrah Ops",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} ${barlow.variable} ${naskh.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0..1,0&display=block"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Extract the logo SVGs from the brand PDF.** The uploaded PDF is `/root/.claude/uploads/7efe3e9b-4803-5fec-8502-0eb2cfa15c3c/aa5c0426-Al-Sakhra_Logo.pdf`. Its page 2 is the flat Pantone version.

```bash
cd ops && mkdir -p public/brand
pdftocairo -svg -f 2 -l 2 "/root/.claude/uploads/7efe3e9b-4803-5fec-8502-0eb2cfa15c3c/aa5c0426-Al-Sakhra_Logo.pdf" /tmp/logo-page2.svg
python3 -I - <<'EOF'
import re
src = open('/tmp/logo-page2.svg').read()
def crop(vb, out):
    s = re.sub(r'width="[^"]+"', 'width="%s"' % vb.split()[2], src, count=1)
    s = re.sub(r'height="[^"]+"', 'height="%s"' % vb.split()[3], s, count=1)
    s = re.sub(r'viewBox="[^"]+"', 'viewBox="%s"' % vb, s, count=1)
    open(out, 'w').write(s)
# Page is 841.89 x 595.28 pt. Full logo: S + Arabic + Latin wordmark. Mark: the S only.
crop("250 45 345 340", "public/brand/logo.svg")
crop("288 48 262 250", "public/brand/logo-mark.svg")
EOF
```

Check both SVGs visually: render them with Playwright to `/tmp/logo-check.png` and look at the image. Tune the four viewBox numbers until the full logo shows the S, "الصخرة للصناعة" and "AL-SAKHRA FOR INDUSTRY" with even margins, and the mark shows only the S. Neither may include any of the Pantone swatches. If `pdftocairo` produced no `viewBox` attribute, add `viewBox="0 0 841.89 595.28"` to the `<svg>` tag first and rerun the crop.

- [ ] **Step 7: Write the UI primitives**

`ops/components/ui/Icon.tsx`:
```tsx
export function Icon({ name, className = "", filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none ${className}`}
      style={filled ? { fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' } : undefined}
    >
      {name}
    </span>
  );
}
```

`ops/components/ui/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-royal-600 text-white hover:bg-royal-700 disabled:bg-mist-300",
  secondary: "bg-white text-navy-700 border border-mist-300 hover:border-royal-600 disabled:text-mist-300",
  danger: "bg-bad-600 text-white hover:brightness-95 disabled:bg-mist-300",
  ghost: "bg-transparent text-navy-700 hover:bg-royal-50",
};
const SIZES: Record<Size, string> = { md: "h-10 px-4 text-sm", lg: "h-14 px-6 text-lg" };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}
```

`ops/components/ui/Card.tsx`:
```tsx
export function Card({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t-4 border-royal-600 bg-white p-5 shadow-sm ${className}`}>
      {(title || eyebrow) && (
        <header className="mb-4 flex items-baseline justify-between gap-4">
          {title && <h2 className="text-lg font-bold text-navy-700">{title}</h2>}
          {eyebrow && <span className="eyebrow text-royal-600">{eyebrow}</span>}
        </header>
      )}
      {children}
    </section>
  );
}
```

`ops/components/ui/Field.tsx`:
```tsx
import type { InputHTMLAttributes } from "react";

export function Field({ label, name, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-ink-700">{label}</span>
      <input
        id={name}
        name={name}
        {...props}
        className="h-11 border border-mist-300 bg-white px-3 text-base outline-none focus:border-royal-600 focus:ring-2 focus:ring-royal-100"
      />
    </label>
  );
}
```

`ops/components/ui/FormMessage.tsx`:
```tsx
export function FormMessage({ kind, children }: { kind: "error" | "success"; children?: React.ReactNode }) {
  if (!children) return null;
  const cls = kind === "error" ? "bg-bad-50 text-bad-600" : "bg-ok-50 text-ok-600";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`px-3 py-2 text-sm font-semibold ${cls}`}>
      {children}
    </p>
  );
}
```

`ops/components/brand/Logo.tsx`:
```tsx
/* eslint-disable @next/next/no-img-element */
export function Logo({ variant = "full", className = "" }: { variant?: "full" | "mark"; className?: string }) {
  const src = variant === "full" ? "/brand/logo.svg" : "/brand/logo-mark.svg";
  return <img src={src} alt="الصخرة للصناعة — Al-Sakhra for Industry" className={className} />;
}
```

`ops/app/page.tsx` (temporary):
```tsx
import { Logo } from "@/components/brand/Logo";

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center">
      <Logo className="w-56" />
    </main>
  );
}
```

- [ ] **Step 8: Write the smoke test** at `ops/tests/unit/smoke.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("brand assets", () => {
  it("ships both logo SVGs with a viewBox", () => {
    for (const f of ["public/brand/logo.svg", "public/brand/logo-mark.svg"]) {
      const svg = readFileSync(f, "utf8");
      expect(svg).toMatch(/<svg[^>]*viewBox=/);
    }
  });
});
```

- [ ] **Step 9: Run the tests and the build**

Run: `cd ops && npx vitest run && npx next build`
Expected: 1 test passes, and the build ends with "Compiled successfully" or prints a route table.

- [ ] **Step 10: Screenshot `/`** (`npm run dev`, then Playwright at 1280×800). Check that the logo renders on the mist background, then commit.

```bash
git add ops
git commit -m "feat(ops): scaffold ops app with Al-Sakhrah brand theme and logo"
```

---

### Task 3: Internationalisation (ar / en / ur)

**Files:**
- Create: `ops/lib/i18n/index.ts`, `ops/lib/i18n/en.ts`, `ops/lib/i18n/ar.ts`, `ops/lib/i18n/ur.ts`
- Test: `ops/tests/unit/i18n.test.ts`

**Interfaces:**
- Produces: `type Locale = "ar" | "en" | "ur"`, `LOCALES`, `DEFAULT_LOCALE`, `isLocale(v): v is Locale`, `dirFor(l): "rtl" | "ltr"`, `type MessageKey`, `getDictionary(l): Record<MessageKey, string>`, `translate(dict, key, vars?): string` (replaces `{name}` placeholders), and `type T = (key: MessageKey, vars?: Record<string, string | number>) => string`.

- [ ] **Step 1: Write the failing test** at `ops/tests/unit/i18n.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { LOCALES, dirFor, getDictionary, isLocale, translate } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";

describe("i18n", () => {
  it("has a non-empty string for every key in every locale", () => {
    const keys = Object.keys(en);
    for (const l of LOCALES) {
      const d = getDictionary(l);
      expect(Object.keys(d).sort()).toEqual([...keys].sort());
      for (const k of keys) expect((d as Record<string, string>)[k].trim().length, `${l}:${k}`).toBeGreaterThan(0);
    }
  });

  it("maps direction", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("ur")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });

  it("validates locales", () => {
    expect(isLocale("ur")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("interpolates variables", () => {
    expect(translate(getDictionary("en"), "home.welcome", { name: "Aref" })).toBe("Welcome, Aref");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd ops && npx vitest run tests/unit/i18n.test.ts`
Expected: FAIL with "Cannot find module '@/lib/i18n'".

- [ ] **Step 3: Write `ops/lib/i18n/en.ts`**, the source of truth for keys

```ts
export const en = {
  "app.name": "Al-Sakhrah Operations",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.add": "Add",
  "common.logout": "Log out",
  "common.language": "Language",
  "common.active": "Active",
  "common.inactive": "Inactive",
  "common.saved": "Saved",
  "common.error_generic": "Something went wrong. Please try again.",
  "common.not_authorized": "You do not have permission to do this.",
  "login.title": "Sign in",
  "login.eyebrow": "Operations portal",
  "login.username": "Username",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.error_invalid": "Wrong username or password.",
  "login.error_locked": "Too many attempts. Try again in 15 minutes.",
  "login.error_inactive": "This account is disabled.",
  "password.title": "Choose a new password",
  "password.hint": "You must set your own password before continuing.",
  "password.new": "New password",
  "password.confirm": "Confirm password",
  "password.submit": "Save password",
  "password.error_short": "Use at least 8 characters.",
  "password.error_mismatch": "The passwords do not match.",
  "nav.board": "Today",
  "nav.warehouse": "Warehouse",
  "nav.driver": "My orders",
  "nav.users": "Users",
  "nav.settings": "Settings",
  "role.admin": "Admin",
  "role.sales": "Sales",
  "role.warehouse": "Warehouse keeper",
  "role.driver": "Driver",
  "locale.ar": "العربية",
  "locale.en": "English",
  "locale.ur": "اردو",
  "home.welcome": "Welcome, {name}",
  "home.board_intro": "Today's orders and drivers will appear here.",
  "home.warehouse_intro": "Orders to prepare today will appear here.",
  "home.driver_intro": "Your deliveries will appear here.",
  "users.title": "Users",
  "users.eyebrow": "Accounts",
  "users.username": "Username",
  "users.full_name": "Full name",
  "users.role": "Role",
  "users.locale": "Language",
  "users.status": "Status",
  "users.temp_password": "Temporary password",
  "users.create": "Create account",
  "users.created": "Account created. Share the temporary password with the user.",
  "users.reset_password": "Reset password",
  "users.password_reset_done": "Password reset. The user must change it at next login.",
  "users.error_taken": "This username is already used.",
  "users.error_invalid_username": "Use 3–32 lowercase letters, numbers, dot, dash or underscore.",
  "users.error_weak_password": "Use at least 8 characters.",
  "users.error_self": "You cannot disable or demote your own account.",
  "settings.title": "Settings",
  "settings.reps": "Sales reps",
  "settings.rep_name": "Rep name",
  "settings.error_rep_taken": "This rep already exists.",
  "settings.reasons": "Not-delivered reasons",
  "settings.reason_code": "Code",
  "settings.reason_label_ar": "Label (Arabic)",
  "settings.reason_label_en": "Label (English)",
  "settings.reason_label_ur": "Label (Urdu)",
  "settings.reason_icon": "Icon",
  "settings.reason_sort": "Order",
  "settings.warehouse": "Warehouse",
  "settings.warehouse_name": "Warehouse name",
  "settings.maps_link": "Google Maps link or coordinates",
  "settings.location_set": "Location: {lat}, {lng}",
  "settings.location_missing": "No location set yet.",
  "settings.error_maps_link": "Couldn't read a location from this link.",
} as const;

export type MessageKey = keyof typeof en;
```

- [ ] **Step 4: Write `ops/lib/i18n/ar.ts`**

```ts
import type { MessageKey } from "./en";

export const ar: Record<MessageKey, string> = {
  "app.name": "عمليات الصخرة",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.add": "إضافة",
  "common.logout": "تسجيل الخروج",
  "common.language": "اللغة",
  "common.active": "نشط",
  "common.inactive": "موقوف",
  "common.saved": "تم الحفظ",
  "common.error_generic": "حدث خطأ. حاول مرة أخرى.",
  "common.not_authorized": "ليست لديك صلاحية لهذا الإجراء.",
  "login.title": "تسجيل الدخول",
  "login.eyebrow": "Operations portal",
  "login.username": "اسم المستخدم",
  "login.password": "كلمة المرور",
  "login.submit": "دخول",
  "login.error_invalid": "اسم المستخدم أو كلمة المرور غير صحيحة.",
  "login.error_locked": "محاولات كثيرة. حاول بعد ١٥ دقيقة.",
  "login.error_inactive": "هذا الحساب موقوف.",
  "password.title": "اختر كلمة مرور جديدة",
  "password.hint": "يجب تعيين كلمة مرور خاصة بك قبل المتابعة.",
  "password.new": "كلمة المرور الجديدة",
  "password.confirm": "تأكيد كلمة المرور",
  "password.submit": "حفظ كلمة المرور",
  "password.error_short": "استخدم ٨ أحرف على الأقل.",
  "password.error_mismatch": "كلمتا المرور غير متطابقتين.",
  "nav.board": "اليوم",
  "nav.warehouse": "المستودع",
  "nav.driver": "طلباتي",
  "nav.users": "المستخدمون",
  "nav.settings": "الإعدادات",
  "role.admin": "مدير",
  "role.sales": "مبيعات",
  "role.warehouse": "أمين مستودع",
  "role.driver": "سائق",
  "locale.ar": "العربية",
  "locale.en": "English",
  "locale.ur": "اردو",
  "home.welcome": "أهلاً، {name}",
  "home.board_intro": "ستظهر هنا طلبات اليوم والسائقون.",
  "home.warehouse_intro": "ستظهر هنا الطلبات المطلوب تجهيزها اليوم.",
  "home.driver_intro": "ستظهر هنا طلبات التوصيل الخاصة بك.",
  "users.title": "المستخدمون",
  "users.eyebrow": "Accounts",
  "users.username": "اسم المستخدم",
  "users.full_name": "الاسم الكامل",
  "users.role": "الدور",
  "users.locale": "اللغة",
  "users.status": "الحالة",
  "users.temp_password": "كلمة مرور مؤقتة",
  "users.create": "إنشاء حساب",
  "users.created": "تم إنشاء الحساب. أعطِ المستخدم كلمة المرور المؤقتة.",
  "users.reset_password": "إعادة تعيين كلمة المرور",
  "users.password_reset_done": "تمت إعادة التعيين. سيُطلب من المستخدم تغييرها عند الدخول.",
  "users.error_taken": "اسم المستخدم مستخدم مسبقاً.",
  "users.error_invalid_username": "استخدم من ٣ إلى ٣٢ حرفاً إنجليزياً صغيراً أو أرقاماً أو . - _",
  "users.error_weak_password": "استخدم ٨ أحرف على الأقل.",
  "users.error_self": "لا يمكنك إيقاف حسابك أو تغيير دورك.",
  "settings.title": "الإعدادات",
  "settings.reps": "المندوبون",
  "settings.rep_name": "اسم المندوب",
  "settings.error_rep_taken": "هذا المندوب موجود مسبقاً.",
  "settings.reasons": "أسباب عدم التسليم",
  "settings.reason_code": "الرمز",
  "settings.reason_label_ar": "النص (عربي)",
  "settings.reason_label_en": "النص (إنجليزي)",
  "settings.reason_label_ur": "النص (أردو)",
  "settings.reason_icon": "الأيقونة",
  "settings.reason_sort": "الترتيب",
  "settings.warehouse": "المستودع",
  "settings.warehouse_name": "اسم المستودع",
  "settings.maps_link": "رابط قوقل ماب أو الإحداثيات",
  "settings.location_set": "الموقع: {lat}، {lng}",
  "settings.location_missing": "لم يتم تحديد الموقع بعد.",
  "settings.error_maps_link": "تعذّر قراءة الموقع من هذا الرابط.",
};
```

- [ ] **Step 5: Write `ops/lib/i18n/ur.ts`**

```ts
import type { MessageKey } from "./en";

export const ur: Record<MessageKey, string> = {
  "app.name": "الصخرہ آپریشنز",
  "common.save": "محفوظ کریں",
  "common.cancel": "منسوخ کریں",
  "common.add": "شامل کریں",
  "common.logout": "لاگ آؤٹ",
  "common.language": "زبان",
  "common.active": "فعال",
  "common.inactive": "غیر فعال",
  "common.saved": "محفوظ ہو گیا",
  "common.error_generic": "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔",
  "common.not_authorized": "آپ کو اس کی اجازت نہیں ہے۔",
  "login.title": "سائن ان",
  "login.eyebrow": "Operations portal",
  "login.username": "یوزر نیم",
  "login.password": "پاس ورڈ",
  "login.submit": "سائن ان",
  "login.error_invalid": "یوزر نیم یا پاس ورڈ غلط ہے۔",
  "login.error_locked": "بہت زیادہ کوششیں۔ 15 منٹ بعد دوبارہ کوشش کریں۔",
  "login.error_inactive": "یہ اکاؤنٹ بند ہے۔",
  "password.title": "نیا پاس ورڈ منتخب کریں",
  "password.hint": "آگے بڑھنے سے پہلے اپنا پاس ورڈ بنائیں۔",
  "password.new": "نیا پاس ورڈ",
  "password.confirm": "پاس ورڈ کی تصدیق",
  "password.submit": "پاس ورڈ محفوظ کریں",
  "password.error_short": "کم از کم 8 حروف استعمال کریں۔",
  "password.error_mismatch": "پاس ورڈ ایک جیسے نہیں ہیں۔",
  "nav.board": "آج",
  "nav.warehouse": "گودام",
  "nav.driver": "میرے آرڈر",
  "nav.users": "صارفین",
  "nav.settings": "ترتیبات",
  "role.admin": "ایڈمن",
  "role.sales": "سیلز",
  "role.warehouse": "گودام کیپر",
  "role.driver": "ڈرائیور",
  "locale.ar": "العربية",
  "locale.en": "English",
  "locale.ur": "اردو",
  "home.welcome": "خوش آمدید، {name}",
  "home.board_intro": "آج کے آرڈر اور ڈرائیور یہاں نظر آئیں گے۔",
  "home.warehouse_intro": "آج تیار کرنے والے آرڈر یہاں نظر آئیں گے۔",
  "home.driver_intro": "آپ کی ڈیلیوریاں یہاں نظر آئیں گی۔",
  "users.title": "صارفین",
  "users.eyebrow": "Accounts",
  "users.username": "یوزر نیم",
  "users.full_name": "پورا نام",
  "users.role": "کردار",
  "users.locale": "زبان",
  "users.status": "حالت",
  "users.temp_password": "عارضی پاس ورڈ",
  "users.create": "اکاؤنٹ بنائیں",
  "users.created": "اکاؤنٹ بن گیا۔ عارضی پاس ورڈ صارف کو دیں۔",
  "users.reset_password": "پاس ورڈ ری سیٹ کریں",
  "users.password_reset_done": "پاس ورڈ ری سیٹ ہو گیا۔ اگلے لاگ ان پر صارف اسے تبدیل کرے گا۔",
  "users.error_taken": "یہ یوزر نیم پہلے سے موجود ہے۔",
  "users.error_invalid_username": "3 سے 32 چھوٹے انگریزی حروف، نمبر، نقطہ، ڈیش یا انڈر اسکور استعمال کریں۔",
  "users.error_weak_password": "کم از کم 8 حروف استعمال کریں۔",
  "users.error_self": "آپ اپنا اکاؤنٹ بند یا اپنا کردار تبدیل نہیں کر سکتے۔",
  "settings.title": "ترتیبات",
  "settings.reps": "سیلز نمائندے",
  "settings.rep_name": "نمائندے کا نام",
  "settings.error_rep_taken": "یہ نمائندہ پہلے سے موجود ہے۔",
  "settings.reasons": "ڈیلیوری نہ ہونے کی وجوہات",
  "settings.reason_code": "کوڈ",
  "settings.reason_label_ar": "متن (عربی)",
  "settings.reason_label_en": "متن (انگریزی)",
  "settings.reason_label_ur": "متن (اردو)",
  "settings.reason_icon": "آئیکن",
  "settings.reason_sort": "ترتیب",
  "settings.warehouse": "گودام",
  "settings.warehouse_name": "گودام کا نام",
  "settings.maps_link": "گوگل میپس لنک یا کوآرڈینیٹس",
  "settings.location_set": "مقام: {lat}، {lng}",
  "settings.location_missing": "ابھی مقام مقرر نہیں ہوا۔",
  "settings.error_maps_link": "اس لنک سے مقام نہیں پڑھا جا سکا۔",
};
```

- [ ] **Step 6: Write `ops/lib/i18n/index.ts`**

```ts
import { ar } from "./ar";
import { en, type MessageKey } from "./en";
import { ur } from "./ur";

export type { MessageKey };
export const LOCALES = ["ar", "en", "ur"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";
export type Dictionary = Record<MessageKey, string>;
export type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

const DICTS: Record<Locale, Dictionary> = { ar, en, ur };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function dirFor(l: Locale): "rtl" | "ltr" {
  return l === "en" ? "ltr" : "rtl";
}

export function getDictionary(l: Locale): Dictionary {
  return DICTS[l];
}

export function translate(dict: Dictionary, key: MessageKey, vars?: Record<string, string | number>): string {
  const raw = dict[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function makeT(l: Locale): T {
  const d = getDictionary(l);
  return (key, vars) => translate(d, key, vars);
}
```

- [ ] **Step 7: Run the tests**

Run: `cd ops && npx vitest run tests/unit/i18n.test.ts`
Expected: 4 tests pass.

- [ ] **Step 8: Commit**

```bash
git add ops/lib/i18n ops/tests/unit/i18n.test.ts
git commit -m "feat(ops): add ar/en/ur dictionaries and translation helpers"
```

---

### Task 4: Order status rules and role routing (pure TypeScript)

**Files:**
- Create: `ops/lib/orders/status.ts`, `ops/lib/auth/roles.ts`, `ops/lib/auth/username.ts`
- Test: `ops/tests/unit/status.test.ts`, `ops/tests/unit/roles.test.ts`

**Interfaces:**
- Produces:
  - `ORDER_STATUSES`, `type OrderStatus`, `type Role`, `ROLES`, `canTransition({ from, to, role, external, isAssignedDriver }): boolean`.
  - `homeFor(role: Role): string` and `NAV_BY_ROLE: Record<Role, { href: string; key: MessageKey; icon: string }[]>`.
  - `normalizeUsername(s): string`, `isValidUsername(s): boolean`, `toAuthEmail(username): string`.
  - These rules are mirrored in SQL (Task 5); the matrix test in Task 5 uses the same cases.

- [ ] **Step 1: Write the failing tests**

`ops/tests/unit/status.test.ts`:
```ts
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
```

`ops/tests/unit/roles.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { NAV_BY_ROLE, homeFor } from "@/lib/auth/roles";
import { isValidUsername, normalizeUsername, toAuthEmail } from "@/lib/auth/username";

describe("roles", () => {
  it("routes each role home", () => {
    expect(homeFor("admin")).toBe("/admin/users");
    expect(homeFor("sales")).toBe("/board");
    expect(homeFor("warehouse")).toBe("/warehouse");
    expect(homeFor("driver")).toBe("/driver");
  });
  it("puts each role's home first in its nav", () => {
    for (const role of ["admin", "sales", "warehouse", "driver"] as const) {
      expect(NAV_BY_ROLE[role][0].href).toBe(homeFor(role));
    }
  });
});

describe("username", () => {
  it("normalizes and validates", () => {
    expect(normalizeUsername("  Aref.K ")).toBe("aref.k");
    expect(isValidUsername("aref.k")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("عارف")).toBe(false);
    expect(isValidUsername("a".repeat(33))).toBe(false);
  });
  it("maps to the internal auth email", () => {
    expect(toAuthEmail(" Naeem ")).toBe("naeem@users.ops.local");
  });
});
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `cd ops && npx vitest run tests/unit/status.test.ts tests/unit/roles.test.ts`
Expected: FAIL with module-not-found errors.

- [ ] **Step 3: Implement the modules**

`ops/lib/orders/status.ts`:
```ts
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
```

`ops/lib/auth/roles.ts`:
```ts
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
    { href: "/board", key: "nav.board", icon: "local_shipping" },
    { href: "/warehouse", key: "nav.warehouse", icon: "inventory_2" },
    { href: "/admin/settings", key: "nav.settings", icon: "settings" },
  ],
  sales: [{ href: "/board", key: "nav.board", icon: "local_shipping" }],
  warehouse: [{ href: "/warehouse", key: "nav.warehouse", icon: "inventory_2" }],
  driver: [{ href: "/driver", key: "nav.driver", icon: "route" }],
};

/** Which roles may open a route prefix. Used by the (app) layout guard. */
export const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/board", roles: ["admin", "sales"] },
  { prefix: "/warehouse", roles: ["admin", "warehouse"] },
  { prefix: "/driver", roles: ["driver"] },
];

export function canOpen(role: Role, pathname: string): boolean {
  const rule = ROUTE_ROLES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  return rule ? rule.roles.includes(role) : true;
}
```

`ops/lib/auth/username.ts`:
```ts
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;
export const AUTH_EMAIL_DOMAIN = "users.ops.local";

export function normalizeUsername(s: string): string {
  return s.trim().toLowerCase();
}

export function isValidUsername(s: string): boolean {
  return USERNAME_RE.test(s);
}

export function toAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}
```

Add one more case to `roles.test.ts` for `canOpen`:
```ts
import { canOpen } from "@/lib/auth/roles";
it("guards route prefixes", () => {
  expect(canOpen("sales", "/admin/users")).toBe(false);
  expect(canOpen("admin", "/board")).toBe(true);
  expect(canOpen("driver", "/board")).toBe(false);
  expect(canOpen("warehouse", "/warehouse")).toBe(true);
});
```

- [ ] **Step 4: Run the tests**

Run: `cd ops && npx vitest run`
Expected: all tests pass (23 transition cases + roles + username + i18n + smoke).

- [ ] **Step 5: Commit**

```bash
git add ops/lib/orders ops/lib/auth/roles.ts ops/lib/auth/username.ts ops/tests/unit
git commit -m "feat(ops): add order transition rules, role routing and username helpers"
```

---

### Task 5: Database schema, functions and RLS with a local SQL test harness

**Files:**
- Create: `ops/supabase/migrations/0001_schema.sql`, `0002_order_functions.sql`, `0003_account_functions.sql`, `0004_rls.sql`, `0005_seed.sql`
- Create: `ops/supabase/tests/run.sh`, `shim.sql`, `helpers.sql`
- Test: `ops/supabase/tests/010_transition.test.sql`, `020_rls.test.sql`, `030_accounts.test.sql`

**Interfaces:**
- Produces, for later plans:
  - **Tables:** `warehouses`, `customers`, `branches`, `sales_reps`, `profiles`, `trips`, `orders`, `failure_reasons`, `proofs`, `driver_locations`, `order_events`, `login_attempts`.
  - **Enums:** `app_role`, `app_locale`, `order_status`, `proof_outcome`.
  - **Functions:**
    - `app_role() → app_role`
    - `riyadh_today() → date`
    - `transition_order(p_order_id uuid, p_to order_status, p_meta jsonb default '{}') → orders`
    - `admin_create_user(p_username, p_full_name, p_role, p_locale, p_password) → uuid`
    - `admin_reset_password(p_user_id uuid, p_password text) → void`
    - `admin_update_user(p_user_id, p_full_name, p_role, p_locale, p_active) → void`
    - `bootstrap_admin(p_username, p_full_name, p_password) → uuid`
    - `set_my_locale(p_locale app_locale) → void`
    - `clear_must_change_password() → void`
    - `login_is_locked(p_username text) → boolean`
    - `record_login_attempt(p_username text, p_success boolean) → void`
  - **Error messages raised:** `not_authorized`, `order_not_found`, `invalid_transition`, `undo_window_passed`, `invalid_driver`, `invalid_username`, `username_taken`, `weak_password`, `cannot_modify_self`, `admin_exists`.

- [ ] **Step 1: Write the local Supabase shim** at `ops/supabase/tests/shim.sql`. It only mimics the parts of Supabase that the migrations touch.

```sql
-- Minimal stand-in for Supabase's auth schema and roles, for local tests only.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema extensions;
create extension pgcrypto with schema extensions;
create schema auth;
grant usage on schema auth to anon, authenticated;

create table auth.users (
  instance_id uuid,
  id uuid primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255) unique,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  banned_until timestamptz,
  confirmation_token varchar(255),
  recovery_token varchar(255),
  email_change_token_new varchar(255),
  email_change varchar(255)
);

create table auth.identities (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  unique (provider_id, provider)
);

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
```

- [ ] **Step 2: Write the test helpers** at `ops/supabase/tests/helpers.sql`

```sql
create schema tests;

-- Act as a signed-in user for the rest of the transaction.
create function tests.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

-- Assert that a SQL string raises an error whose message contains p_expected.
create function tests.expect_error(p_sql text, p_expected text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(p_expected in sqlerrm) = 0 then
      raise exception 'expected error "%" but got "%" for: %', p_expected, sqlerrm, p_sql;
    end if;
    return;
  end;
  raise exception 'expected error "%" but statement succeeded: %', p_expected, p_sql;
end $$;

create function tests.expect_eq(p_actual anyelement, p_expected anyelement, p_label text) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception '%: expected %, got %', p_label, p_expected, p_actual;
  end if;
end $$;

-- Create a user with a profile directly (as superuser), bypassing admin checks.
create function tests.make_user(p_username text, p_role app_role) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (v_id, p_username || '@users.ops.local');
  insert into public.profiles (user_id, username, full_name, role, must_change_password)
  values (v_id, p_username, initcap(p_username), p_role, false);
  return v_id;
end $$;

grant usage on schema tests to authenticated, anon;
grant execute on all functions in schema tests to authenticated, anon;
```

- [ ] **Step 3: Write the runner** at `ops/supabase/tests/run.sh`. It re-runs itself as the `postgres` OS user when started as root, because `initdb` refuses to run as root.

```bash
#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"

if [ "$(id -u)" = "0" ]; then
  TMP="$(mktemp -d)"; chmod 755 "$TMP"
  cp -r "$ROOT" "$TMP/supabase"; chown -R postgres "$TMP"
  exec runuser -u postgres -- env PGBIN="$PGBIN" bash "$TMP/supabase/tests/run.sh"
fi

WORK="$(mktemp -d)"
cleanup() { "$PGBIN/pg_ctl" -D "$WORK/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
"$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$WORK/data" -o "-k $WORK -p 54329 -c listen_addresses=''" -l "$WORK/log" start -w >/dev/null
PSQL=(psql -X -h "$WORK" -p 54329 -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f "$DIR/shim.sql"
for f in "$ROOT"/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$DIR/helpers.sql"
for f in "$DIR"/[0-9]*.test.sql; do
  echo "== $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "ALL SQL TESTS PASSED"
```

Run: `chmod +x ops/supabase/tests/run.sh`

- [ ] **Step 4: Write the failing transition tests** at `ops/supabase/tests/010_transition.test.sql`

```sql
begin;
do $$
declare
  v_admin uuid := tests.make_user('admin1', 'admin');
  v_sales uuid := tests.make_user('sales1', 'sales');
  v_wh uuid := tests.make_user('wh1', 'warehouse');
  v_drv uuid := tests.make_user('aref', 'driver');
  v_drv2 uuid := tests.make_user('naeem', 'driver');
  v_cust uuid; v_branch uuid; v_rep uuid; v_o uuid; v_ext uuid; v_row orders;
begin
  insert into customers(name) values ('الحسين توب') returning id into v_cust;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'مخرج ٦', 24.75, 46.72) returning id into v_branch;
  insert into sales_reps(name) values ('مجد') returning id into v_rep;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
    values (v_branch, v_rep, 'PO-1', v_drv, v_sales) returning id into v_o;
  insert into orders(branch_id, sales_rep_id, po_number, external, created_by)
    values (v_branch, v_rep, 'PO-2', true, v_sales) returning id into v_ext;

  -- sales cannot mark ready
  perform tests.login(v_sales);
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'ready'), 'invalid_transition');
  -- warehouse marks ready, ready_at set, event written
  perform tests.login(v_wh);
  v_row := transition_order(v_o, 'ready');
  perform tests.expect_eq(v_row.status, 'ready'::order_status, 'status after ready');
  perform tests.expect_eq(v_row.ready_at is not null, true, 'ready_at set');
  -- other driver cannot start
  perform tests.login(v_drv2);
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'on_the_way'), 'invalid_transition');
  -- assigned driver can
  perform tests.login(v_drv);
  v_row := transition_order(v_o, 'on_the_way');
  v_row := transition_order(v_o, 'failed', '{"reason":"closed"}');
  perform tests.expect_eq(v_row.status, 'failed'::order_status, 'failed');
  -- reschedule to naeem tomorrow
  perform tests.login(v_sales);
  v_row := transition_order(v_o, 'new', jsonb_build_object('delivery_date', current_date + 1, 'driver_id', v_drv2, 'external', false));
  perform tests.expect_eq(v_row.driver_id, v_drv2, 'rescheduled driver');
  perform tests.expect_eq(v_row.delivery_date, current_date + 1, 'rescheduled date');
  perform tests.expect_eq(v_row.ready_at, null::timestamptz, 'ready_at cleared');
  -- reschedule to a non-driver is rejected
  perform tests.login(v_admin);
  v_row := transition_order(v_o, 'cancelled');
  -- terminal
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'new'), 'invalid_transition');
  -- external: sales confirms delivery directly from ready
  perform tests.login(v_wh);
  perform transition_order(v_ext, 'ready');
  perform tests.login(v_sales);
  v_row := transition_order(v_ext, 'delivered');
  perform tests.expect_eq(v_row.delivered_at is not null, true, 'external delivered_at');
  -- events written for every transition of v_o (ready, on_the_way, failed, new, cancelled)
  perform tests.logout();
  perform tests.expect_eq((select count(*) from order_events where order_id = v_o), 5::bigint, 'event count');
  -- unauthenticated
  perform tests.expect_error(format('select transition_order(%L, %L)', v_ext, 'cancelled'), 'not_authorized');
end $$;

-- undo window
do $$
declare v_wh uuid := (select user_id from profiles where username='wh1');
        v_o uuid; v_row orders;
begin
  select id into v_o from orders where po_number = 'PO-1';
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
    select branch_id, sales_rep_id, 'PO-3', driver_id, created_by from orders where id = v_o returning id into v_o;
  perform tests.login(v_wh);
  perform transition_order(v_o, 'ready');
  v_row := transition_order(v_o, 'new');
  perform tests.expect_eq(v_row.status, 'new'::order_status, 'undo inside window');
  perform transition_order(v_o, 'ready');
  perform tests.logout();
  update orders set ready_at = now() - interval '6 minutes' where id = v_o;
  perform tests.login(v_wh);
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'new'), 'undo_window_passed');
  perform tests.logout();
end $$;

-- driver_id must be an active driver
do $$
begin
  perform tests.expect_error(
    format($q$insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
             select branch_id, sales_rep_id, 'PO-X', %L, created_by from orders limit 1$q$,
           (select user_id from profiles where username = 'sales1')),
    'invalid_driver');
  perform tests.expect_error(
    $q$insert into orders(branch_id, sales_rep_id, po_number, created_by)
       select branch_id, sales_rep_id, 'PO-Y', created_by from orders limit 1$q$,
    'driver_or_external');
end $$;
rollback;
```

Note: the comment "reschedule to a non-driver is rejected" covers the `invalid_driver` trigger, which is exercised in the last block.

- [ ] **Step 5: Run the tests to make sure they fail**

Run: `cd ops && npm run test:sql`
Expected: FAIL, because the migrations folder is empty and `make_user` references a missing `profiles` table.

- [ ] **Step 6: Write `ops/supabase/migrations/0001_schema.sql`**

```sql
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin', 'sales', 'warehouse', 'driver');
create type public.app_locale as enum ('ar', 'en', 'ur');
create type public.order_status as enum ('new', 'ready', 'on_the_way', 'delivered', 'failed', 'cancelled');
create type public.proof_outcome as enum ('delivered', 'failed');

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  name text not null,
  phone text,
  google_place_id text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address_text text,
  created_at timestamptz not null default now(),
  unique (customer_id, name)
);

create table public.sales_reps (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  full_name text not null,
  role public.app_role not null,
  locale public.app_locale not null default 'ar',
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(user_id),
  warehouse_id uuid not null references public.warehouses(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('manual', 'geofence', 'timeout')),
  polyline text,
  distance_m integer
);
create unique index trips_one_active_per_driver on public.trips(driver_id) where ended_at is null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  sales_rep_id uuid not null references public.sales_reps(id),
  po_number text not null check (length(trim(po_number)) > 0),
  po_photo_path text,
  driver_id uuid references public.profiles(user_id),
  external boolean not null default false,
  delivery_date date not null default ((now() at time zone 'Asia/Riyadh')::date),
  status public.order_status not null default 'new',
  notes text,
  trip_id uuid references public.trips(id),
  stop_seq integer,
  eta timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint driver_or_external check ((driver_id is not null and not external) or (driver_id is null and external))
);
create index orders_date_status on public.orders(delivery_date, status);
create index orders_driver_date on public.orders(driver_id, delivery_date);

create table public.failure_reasons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]{2,32}$'),
  label_ar text not null,
  label_en text not null,
  label_ur text not null,
  icon text not null,
  active boolean not null default true,
  sort integer not null default 0
);

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  outcome public.proof_outcome not null,
  reason_id uuid references public.failure_reasons(id),
  note text,
  photo_path text,
  lat double precision,
  lng double precision,
  accuracy_m real,
  far_from_store boolean not null default false,
  recorded_at timestamptz not null,
  synced_at timestamptz not null default now()
);

create table public.driver_locations (
  id bigint generated always as identity primary key,
  client_id uuid not null unique,
  trip_id uuid not null references public.trips(id) on delete cascade,
  driver_id uuid not null references public.profiles(user_id),
  lat double precision not null,
  lng double precision not null,
  accuracy_m real,
  speed real,
  recorded_at timestamptz not null
);
create index driver_locations_latest on public.driver_locations(driver_id, recorded_at desc);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id),
  from_status public.order_status,
  to_status public.order_status not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index order_events_order on public.order_events(order_id, created_at);

create table public.login_attempts (
  id bigint generated always as identity primary key,
  username text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);
create index login_attempts_user_time on public.login_attempts(username, attempted_at desc);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create function public.check_order_driver() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.driver_id is not null and not exists (
    select 1 from profiles where user_id = new.driver_id and role = 'driver' and active
  ) then
    raise exception 'invalid_driver' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger orders_driver_check before insert or update of driver_id on public.orders
  for each row execute function public.check_order_driver();
```

- [ ] **Step 7: Write `ops/supabase/migrations/0002_order_functions.sql`**

```sql
create function public.app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where user_id = auth.uid() and active
$$;

create function public.riyadh_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Riyadh')::date
$$;

-- Single entry point for every order status change. Mirrors lib/orders/status.ts.
create function public.transition_order(p_order_id uuid, p_to public.order_status, p_meta jsonb default '{}'::jsonb)
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
```

- [ ] **Step 8: Write `ops/supabase/migrations/0003_account_functions.sql`**

```sql
-- Internal: create an auth user + identity + profile. Not callable by clients.
create function public._create_user(p_username text, p_full_name text, p_role public.app_role,
                                    p_locale public.app_locale, p_password text, p_must_change boolean)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_id uuid := gen_random_uuid(); v_email text; v_username text := lower(trim(p_username));
begin
  if v_username !~ '^[a-z0-9._-]{3,32}$' then raise exception 'invalid_username' using errcode = '22023'; end if;
  if coalesce(length(p_password), 0) < 8 then raise exception 'weak_password' using errcode = '22023'; end if;
  if exists (select 1 from profiles where username = v_username) then
    raise exception 'username_taken' using errcode = '23505';
  end if;
  v_email := v_username || '@users.ops.local';
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          crypt(p_password, gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('username', v_username),
          now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());
  insert into profiles (user_id, username, full_name, role, locale, must_change_password)
  values (v_id, v_username, trim(p_full_name), p_role, p_locale, p_must_change);
  return v_id;
end $$;
revoke all on function public._create_user(text, text, public.app_role, public.app_locale, text, boolean) from public, anon, authenticated;

create function public.admin_create_user(p_username text, p_full_name text, p_role public.app_role,
                                         p_locale public.app_locale, p_password text)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if app_role() is distinct from 'admin' then raise exception 'not_authorized' using errcode = '42501'; end if;
  return _create_user(p_username, p_full_name, p_role, p_locale, p_password, true);
end $$;

-- One-time: creates the first admin. Only works while no admin exists; not callable by clients.
create function public.bootstrap_admin(p_username text, p_full_name text, p_password text)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profiles where role = 'admin') then
    raise exception 'admin_exists' using errcode = '22023';
  end if;
  return _create_user(p_username, p_full_name, 'admin', 'ar', p_password, true);
end $$;
revoke all on function public.bootstrap_admin(text, text, text) from public, anon, authenticated;

create function public.admin_reset_password(p_user_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  if app_role() is distinct from 'admin' then raise exception 'not_authorized' using errcode = '42501'; end if;
  if coalesce(length(p_password), 0) < 8 then raise exception 'weak_password' using errcode = '22023'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = p_user_id;
  update profiles set must_change_password = true where user_id = p_user_id;
end $$;

create function public.admin_update_user(p_user_id uuid, p_full_name text, p_role public.app_role,
                                         p_locale public.app_locale, p_active boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if app_role() is distinct from 'admin' then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_user_id = auth.uid() and (not p_active or p_role <> 'admin') then
    raise exception 'cannot_modify_self' using errcode = '22023';
  end if;
  update profiles set full_name = trim(p_full_name), role = p_role, locale = p_locale, active = p_active
  where user_id = p_user_id;
  update auth.users set banned_until = case when p_active then null else 'infinity'::timestamptz end
  where id = p_user_id;
end $$;

create function public.set_my_locale(p_locale public.app_locale)
returns void language sql security definer set search_path = public as $$
  update profiles set locale = p_locale where user_id = auth.uid()
$$;

create function public.clear_must_change_password()
returns void language sql security definer set search_path = public as $$
  update profiles set must_change_password = false where user_id = auth.uid()
$$;

create function public.login_is_locked(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select count(*) >= 5 from login_attempts
  where username = lower(trim(p_username)) and not success
    and attempted_at > now() - interval '15 minutes'
    and attempted_at > coalesce((select max(attempted_at) from login_attempts
                                 where username = lower(trim(p_username)) and success), '-infinity')
$$;

-- Failures can be recorded by anyone (pre-login). Successes only by that user, so nobody can unlock someone else.
create function public.record_login_attempt(p_username text, p_success boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_success and not exists (
    select 1 from profiles where user_id = auth.uid() and username = lower(trim(p_username))
  ) then
    return;
  end if;
  insert into login_attempts(username, success) values (lower(trim(p_username)), p_success);
end $$;
```

- [ ] **Step 9: Write `ops/supabase/migrations/0004_rls.sql`**

```sql
alter table public.warehouses enable row level security;
alter table public.customers enable row level security;
alter table public.branches enable row level security;
alter table public.sales_reps enable row level security;
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.orders enable row level security;
alter table public.failure_reasons enable row level security;
alter table public.proofs enable row level security;
alter table public.driver_locations enable row level security;
alter table public.order_events enable row level security;
alter table public.login_attempts enable row level security;

revoke all on all tables in schema public from anon;

-- Reference data: everyone signed in reads, admin writes.
create policy warehouses_read on public.warehouses for select to authenticated using (true);
create policy warehouses_admin on public.warehouses for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy sales_reps_read on public.sales_reps for select to authenticated using (true);
create policy sales_reps_admin on public.sales_reps for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy failure_reasons_read on public.failure_reasons for select to authenticated using (true);
create policy failure_reasons_admin on public.failure_reasons for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');

-- Profiles: office roles see everyone (to pick drivers); drivers see themselves. Writes via functions only.
create policy profiles_read on public.profiles for select to authenticated
  using (user_id = auth.uid() or app_role() in ('admin', 'sales', 'warehouse'));

-- Customers and branches
create policy customers_read on public.customers for select to authenticated
  using (app_role() in ('admin', 'sales', 'warehouse'));
create policy customers_write on public.customers for insert to authenticated
  with check (app_role() in ('admin', 'sales'));
create policy customers_update on public.customers for update to authenticated
  using (app_role() in ('admin', 'sales')) with check (app_role() in ('admin', 'sales'));
create policy branches_read on public.branches for select to authenticated
  using (app_role() in ('admin', 'sales', 'warehouse')
         or exists (select 1 from orders o where o.branch_id = branches.id and o.driver_id = auth.uid()));
create policy branches_write on public.branches for insert to authenticated
  with check (app_role() in ('admin', 'sales'));
create policy branches_update on public.branches for update to authenticated
  using (app_role() in ('admin', 'sales')) with check (app_role() in ('admin', 'sales'));

-- Orders: status only changes through transition_order (security definer).
create policy orders_read on public.orders for select to authenticated using (
  app_role() in ('admin', 'sales')
  or (app_role() = 'warehouse' and delivery_date = riyadh_today())
  or (app_role() = 'driver' and driver_id = auth.uid())
);
create policy orders_insert on public.orders for insert to authenticated
  with check (app_role() in ('admin', 'sales') and status = 'new' and created_by = auth.uid());
create policy orders_update on public.orders for update to authenticated
  using (app_role() in ('admin', 'sales') and status in ('new', 'ready'))
  with check (app_role() in ('admin', 'sales'));
revoke update on public.orders from authenticated;
grant update (branch_id, sales_rep_id, po_number, po_photo_path, driver_id, external, delivery_date, notes)
  on public.orders to authenticated;

create policy order_events_read on public.order_events for select to authenticated
  using (app_role() in ('admin', 'sales'));

-- trips, proofs, driver_locations: policies added in plan 3. login_attempts: functions only.

revoke execute on all functions in schema public from anon;
grant execute on function public.login_is_locked(text) to anon, authenticated;
grant execute on function public.record_login_attempt(text, boolean) to anon, authenticated;
revoke execute on function public._create_user(text, text, public.app_role, public.app_locale, text, boolean) from authenticated;
revoke execute on function public.bootstrap_admin(text, text, text) from authenticated;
```

- [ ] **Step 10: Write `ops/supabase/migrations/0005_seed.sql`**

```sql
insert into public.warehouses (name) values ('مستودع الرياض');

insert into public.failure_reasons (code, label_ar, label_en, label_ur, icon, sort) values
  ('closed',         'المحل مقفل',     'Store closed',   'دکان بند ہے',       'lock',               1),
  ('refused',        'رفض الاستلام',   'Refused',        'لینے سے انکار',      'block',              2),
  ('wrong_location', 'موقع خاطئ',      'Wrong location', 'غلط مقام',          'wrong_location',     3),
  ('payment',        'مشكلة في الدفع', 'Payment issue',  'ادائیگی کا مسئلہ',  'payments',           4),
  ('other',          'سبب آخر',        'Other',          'دوسری وجہ',         'more_horiz',         5);
```

- [ ] **Step 11: Run the transition tests**

Run: `cd ops && npm run test:sql`
Expected: `== 010_transition.test.sql` followed by `ALL SQL TESTS PASSED`. Before continuing, fix any mismatch between the SQL and `lib/orders/status.ts`.

- [ ] **Step 12: Write the RLS tests** at `ops/supabase/tests/020_rls.test.sql`

```sql
begin;
do $$
declare
  v_admin uuid := tests.make_user('admin1', 'admin');
  v_sales uuid := tests.make_user('sales1', 'sales');
  v_wh uuid := tests.make_user('wh1', 'warehouse');
  v_drv uuid := tests.make_user('aref', 'driver');
  v_drv2 uuid := tests.make_user('naeem', 'driver');
  v_cust uuid; v_b1 uuid; v_b2 uuid; v_rep uuid; v_o1 uuid;
begin
  insert into customers(name) values ('الحسين توب') returning id into v_cust;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'مخرج ٦', 24.75, 46.72) returning id into v_b1;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'الربوة', 24.69, 46.76) returning id into v_b2;
  insert into sales_reps(name) values ('مجد') returning id into v_rep;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
    values (v_b1, v_rep, 'PO-1', v_drv, v_sales) returning id into v_o1;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by, delivery_date)
    values (v_b2, v_rep, 'PO-2', v_drv2, v_sales, riyadh_today() + 1);

  -- driver sees only own order and only that order's branch
  perform tests.login(v_drv);
  perform tests.expect_eq((select count(*) from orders), 1::bigint, 'driver orders');
  perform tests.expect_eq((select count(*) from branches), 1::bigint, 'driver branches');
  perform tests.expect_eq((select count(*) from profiles), 1::bigint, 'driver profiles');
  perform tests.expect_eq((select count(*) from customers), 0::bigint, 'driver customers');
  -- driver cannot insert orders or change po_number
  perform tests.expect_error(
    format($q$insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by) values (%L,%L,'X',%L,%L)$q$, v_b1, v_rep, v_drv, v_drv),
    'row-level security');
  update orders set po_number = 'HACK' where id = v_o1;

  -- warehouse sees only today's orders
  perform tests.login(v_wh);
  perform tests.expect_eq((select count(*) from orders), 1::bigint, 'warehouse today only');
  -- warehouse has the column grant but no UPDATE policy: the update silently matches 0 rows
  update orders set notes = 'wh';
  perform tests.logout();
  perform tests.expect_eq((select notes from orders where id = v_o1), null::text, 'warehouse update blocked');

  -- sales sees all, can insert, cannot write status directly
  perform tests.login(v_sales);
  perform tests.expect_eq((select count(*) from orders), 2::bigint, 'sales all orders');
  perform tests.expect_error(format($q$update orders set status = 'delivered' where id = %L$q$, v_o1), 'permission denied');
  update orders set notes = 'back door' where id = v_o1;
  perform tests.expect_error($q$insert into sales_reps(name) values ('x')$q$, 'row-level security');
  perform tests.expect_eq((select count(*) from order_events), 0::bigint, 'sales reads events');

  -- admin manages reference data
  perform tests.login(v_admin);
  insert into sales_reps(name) values ('ناصر');

  perform tests.logout();
  perform tests.expect_eq((select po_number from orders where id = v_o1), 'PO-1', 'driver update blocked');
  perform tests.expect_eq((select notes from orders where id = v_o1), 'back door', 'sales update applied');
end $$;

-- anon sees nothing
do $$
begin
  perform set_config('role', 'anon', true);
  perform tests.expect_error('select count(*) from orders', 'permission denied');
  perform tests.expect_error('select count(*) from profiles', 'permission denied');
  perform set_config('role', 'none', true);
end $$;
rollback;
```

- [ ] **Step 13: Write the account tests** at `ops/supabase/tests/030_accounts.test.sql`

```sql
begin;
do $$
declare v_admin uuid; v_sales uuid; v_new uuid;
begin
  -- bootstrap works once
  v_admin := bootstrap_admin('owner', 'Owner', 'start-pass-1');
  perform tests.expect_eq((select role from profiles where user_id = v_admin), 'admin'::app_role, 'bootstrap role');
  perform tests.expect_eq((select must_change_password from profiles where user_id = v_admin), true, 'must change');
  perform tests.expect_error($q$select bootstrap_admin('owner2','O','start-pass-1')$q$, 'admin_exists');
  perform tests.expect_eq(
    (select encrypted_password = extensions.crypt('start-pass-1', encrypted_password) from auth.users where id = v_admin),
    true, 'password hash');

  -- admin creates users
  perform tests.login(v_admin);
  v_new := admin_create_user(' Aref ', 'عارف', 'driver', 'ur', 'temp-pass-1');
  perform tests.expect_eq((select username from profiles where user_id = v_new), 'aref', 'normalized');
  perform tests.logout();
  perform tests.expect_eq((select email from auth.users where id = v_new)::text, 'aref@users.ops.local', 'email');
  perform tests.expect_eq((select count(*) from auth.identities where user_id = v_new), 1::bigint, 'identity');
  perform tests.login(v_admin);
  perform tests.expect_error($q$select admin_create_user('aref','x','driver','en','temp-pass-1')$q$, 'username_taken');
  perform tests.expect_error($q$select admin_create_user('عارف','x','driver','en','temp-pass-1')$q$, 'invalid_username');
  perform tests.expect_error($q$select admin_create_user('bob','x','driver','en','short')$q$, 'weak_password');
  perform tests.expect_error(format($q$select admin_update_user(%L,'O','sales','ar',true)$q$, v_admin), 'cannot_modify_self');

  -- deactivate bans the auth user
  perform admin_update_user(v_new, 'عارف', 'driver', 'ur', false);
  perform tests.logout();
  perform tests.expect_eq((select banned_until from auth.users where id = v_new), 'infinity'::timestamptz, 'banned');

  -- non-admin cannot manage accounts
  v_sales := tests.make_user('sales1', 'sales');
  perform tests.login(v_sales);
  perform tests.expect_error($q$select admin_create_user('x1','x','driver','en','temp-pass-1')$q$, 'not_authorized');
  perform tests.expect_error(format($q$select admin_reset_password(%L,'new-pass-12')$q$, v_new), 'not_authorized');
  perform tests.expect_error($q$select bootstrap_admin('x2','x','temp-pass-1')$q$, 'permission denied');

  -- own locale + clear flag
  perform set_my_locale('en');
  perform tests.logout();
  perform tests.expect_eq((select locale from profiles where user_id = v_sales), 'en'::app_locale, 'locale');

  -- lockout after 5 failures; another user cannot unlock with a fake success
  perform set_config('role', 'anon', true);
  for i in 1..5 loop perform record_login_attempt('sales1', false); end loop;
  perform tests.expect_eq(login_is_locked('sales1'), true, 'locked');
  perform record_login_attempt('sales1', true);
  perform tests.expect_eq(login_is_locked('sales1'), true, 'anon success ignored');
  perform set_config('role', 'none', true);
  perform tests.login(v_sales);
  perform record_login_attempt('sales1', true);
  perform tests.expect_eq(login_is_locked('sales1'), false, 'unlocked by own success');
  perform tests.logout();
end $$;
rollback;
```

- [ ] **Step 14: Run all SQL tests**

Run: `cd ops && npm run test:sql`
Expected: all three files run, then `ALL SQL TESTS PASSED`.

If `020_rls` fails on the driver branch count because the `branches_read` policy recurses through `orders` RLS, keep the policy but have it call a `security definer` helper, `driver_can_see_branch(branch_id uuid) returns boolean`, which checks `orders` without RLS. Add the helper to `0004_rls.sql`, then rerun.

- [ ] **Step 15: Commit**

```bash
git add ops/supabase
git commit -m "feat(ops): add schema, order transition function, account functions and RLS with SQL tests"
```

---

### Task 6: Apply the migrations to Supabase and bootstrap the first admin

**Files:**
- Create: `ops/lib/db/types.ts`, generated from the live project

**Interfaces:**
- Consumes: the project ref from Task 1 and the migrations from Task 5.
- Produces: a live database with the schema, a first admin account `owner` (temporary password given to the user), and `Database` types.

- [ ] **Step 1: Apply the migrations in order.** Use the Supabase MCP `apply_migration` tool with names `0001_schema`, `0002_order_functions`, `0003_account_functions`, `0004_rls` and `0005_seed`, and the exact file contents. If `0001_schema` fails because the `pgcrypto` extension already exists in another schema, remove `with schema extensions` from that line only, rerun, and note the change in the commit message.

- [ ] **Step 2: Check the security advisors.** Run `get_advisors` with type `security`. Expected: no `rls_disabled` findings. Leave `function_search_path_mutable` warnings only for the `tests` schema (which does not exist remotely). Any other finding must be fixed in a new migration `0006_*.sql`, which also needs a matching local test.

- [ ] **Step 3: Bootstrap the first admin.** Generate a password locally with `openssl rand -base64 12 | tr -d '/+=' | cut -c1-14`. Run `select bootstrap_admin('owner', 'المدير', '<generated>');` via `execute_sql`. Give the user the username `owner` and the temporary password in the final message of this plan, never in a commit or file. The user is forced to change it at first login.

- [ ] **Step 4: Generate the types.** Call `generate_typescript_types` and save the output verbatim to `ops/lib/db/types.ts`.

- [ ] **Step 5: Write the env file.** Create `ops/.env.local` with the URL and the publishable key from Task 1. The file is gitignored; check with `git check-ignore ops/.env.local`, which should print the path.

- [ ] **Step 6: Commit**

```bash
git add ops/lib/db/types.ts
git commit -m "feat(ops): add generated Supabase database types"
```

---

### Task 7: Supabase clients, session helpers, locale resolution and `proxy.ts`

**Files:**
- Create: `ops/lib/db/server.ts`, `ops/lib/db/browser.ts`, `ops/lib/db/errors.ts`, `ops/lib/auth/session.ts`, `ops/lib/i18n/server.ts`, `ops/proxy.ts`
- Modify: `ops/app/layout.tsx`, to read the locale and direction
- Test: `ops/tests/unit/errors.test.ts`

**Interfaces:**
- Consumes: `Database` (Task 6), `Role`, `Locale`, `makeT`, `homeFor`, `canOpen`.
- Produces:
  - `createClient(): Promise<SupabaseClient<Database>>` (server) and `createBrowserSupabase()` (browser).
  - `type CurrentUser = { id: string; username: string; fullName: string; role: Role; locale: Locale; mustChangePassword: boolean }`.
  - `getCurrentUser(): Promise<CurrentUser | null>` (memoised per request with React `cache`).
  - `requireUser(): Promise<CurrentUser>` (redirects to `/login`).
  - `requireRole(roles: Role[]): Promise<CurrentUser>` (redirects to the user's home if the role doesn't match).
  - `getLocale(): Promise<Locale>` and `getT(): Promise<{ locale: Locale; t: T }>`.
  - `dbErrorKey(message: string): MessageKey`.

- [ ] **Step 1: Write the failing test** at `ops/tests/unit/errors.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { dbErrorKey } from "@/lib/db/errors";

describe("dbErrorKey", () => {
  it("maps known database errors to message keys", () => {
    expect(dbErrorKey("username_taken")).toBe("users.error_taken");
    expect(dbErrorKey('ERROR: invalid_username')).toBe("users.error_invalid_username");
    expect(dbErrorKey("weak_password")).toBe("users.error_weak_password");
    expect(dbErrorKey("cannot_modify_self")).toBe("users.error_self");
    expect(dbErrorKey("not_authorized")).toBe("common.not_authorized");
    expect(dbErrorKey('duplicate key value violates unique constraint "sales_reps_name_key"')).toBe("settings.error_rep_taken");
    expect(dbErrorKey("something else")).toBe("common.error_generic");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd ops && npx vitest run tests/unit/errors.test.ts`
Expected: FAIL with a module-not-found error.

- [ ] **Step 3: Implement `ops/lib/db/errors.ts`**

```ts
import type { MessageKey } from "@/lib/i18n";

const MAP: [needle: string, key: MessageKey][] = [
  ["username_taken", "users.error_taken"],
  ["invalid_username", "users.error_invalid_username"],
  ["weak_password", "users.error_weak_password"],
  ["cannot_modify_self", "users.error_self"],
  ["not_authorized", "common.not_authorized"],
  ["sales_reps_name_key", "settings.error_rep_taken"],
];

export function dbErrorKey(message: string): MessageKey {
  return MAP.find(([needle]) => message.includes(needle))?.[1] ?? "common.error_generic";
}
```

Run: `cd ops && npx vitest run tests/unit/errors.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the Supabase clients**

`ops/lib/db/server.ts`:
```ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: proxy.ts refreshes the session instead.
          }
        },
      },
    },
  );
}
```

`ops/lib/db/browser.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

- [ ] **Step 5: Write `ops/lib/auth/session.ts`**

```ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { homeFor } from "@/lib/auth/roles";
import type { Locale } from "@/lib/i18n";
import type { Role } from "@/lib/orders/status";

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  locale: Locale;
  mustChangePassword: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: p } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, role, locale, active, must_change_password")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!p || !p.active) return null;
  return {
    id: p.user_id,
    username: p.username,
    fullName: p.full_name,
    role: p.role,
    locale: p.locale,
    mustChangePassword: p.must_change_password,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/account/password");
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
```

- [ ] **Step 6: Write `ops/lib/i18n/server.ts`**

```ts
import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { DEFAULT_LOCALE, isLocale, makeT, type Locale, type T } from "@/lib/i18n";

export const LOCALE_COOKIE = "ops_locale";

export async function getLocale(): Promise<Locale> {
  const user = await getCurrentUser();
  if (user) return user.locale;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export async function getT(): Promise<{ locale: Locale; t: T }> {
  const locale = await getLocale();
  return { locale, t: makeT(locale) };
}
```

- [ ] **Step 7: Write `ops/proxy.ts`.** Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` first.

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refreshes the session cookie. Must run before any redirect decision.
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!data.user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
```

- [ ] **Step 8: Make the root layout read the locale.** In `ops/app/layout.tsx`, change `RootLayout` to:

```tsx
import { dirFor } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirFor(locale)} className={`${almarai.variable} ${barlow.variable} ${naskh.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0..1,0&display=block"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

Keep the existing font constants and `metadata` export above it.

- [ ] **Step 9: Type-check and run the tests**

Run: `cd ops && npx tsc --noEmit && npx vitest run`
Expected: no type errors, and all tests pass.

- [ ] **Step 10: Commit**

```bash
git add ops/lib ops/proxy.ts ops/app/layout.tsx ops/tests/unit/errors.test.ts
git commit -m "feat(ops): add Supabase clients, session and locale helpers, and auth proxy"
```

---

### Task 8: Login, logout, forced password change and language switch

**Files:**
- Create: `ops/app/login/page.tsx`, `ops/app/login/LoginForm.tsx`, `ops/app/login/actions.ts`
- Create: `ops/app/account/password/page.tsx`, `ops/app/account/password/PasswordForm.tsx`, `ops/app/account/password/actions.ts`
- Create: `ops/app/actions/locale.ts`, `ops/components/shell/LocaleSwitcher.tsx`
- Test: covered by the e2e test in Task 11

**Interfaces:**
- Consumes: `createClient`, `getCurrentUser`, `getT`, `toAuthEmail`, `normalizeUsername`, `isValidUsername`, `homeFor`, `LOCALE_COOKIE`.
- Produces:
  - `loginAction(prev: LoginState, fd: FormData): Promise<LoginState>`, where `type LoginState = { error?: MessageKey }`.
  - `logoutAction(): Promise<void>`.
  - `changePasswordAction(prev, fd)`.
  - `setLocaleAction(fd: FormData): Promise<void>`.
  - `<LocaleSwitcher current={Locale} labels={Record<Locale,string>} />`.

- [ ] **Step 1: Write `ops/app/login/actions.ts`**

```ts
"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { homeFor } from "@/lib/auth/roles";
import { isValidUsername, normalizeUsername, toAuthEmail } from "@/lib/auth/username";
import type { MessageKey } from "@/lib/i18n";

export type LoginState = { error?: MessageKey };

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const username = normalizeUsername(String(fd.get("username") ?? ""));
  const password = String(fd.get("password") ?? "");
  if (!isValidUsername(username) || password.length === 0) return { error: "login.error_invalid" };

  const supabase = await createClient();
  const { data: locked } = await supabase.rpc("login_is_locked", { p_username: username });
  if (locked) return { error: "login.error_locked" };

  const { data, error } = await supabase.auth.signInWithPassword({ email: toAuthEmail(username), password });
  if (error || !data.user) {
    await supabase.rpc("record_login_attempt", { p_username: username, p_success: false });
    return { error: error?.message?.toLowerCase().includes("banned") ? "login.error_inactive" : "login.error_invalid" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active, must_change_password")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    return { error: "login.error_inactive" };
  }
  await supabase.rpc("record_login_attempt", { p_username: username, p_success: true });
  redirect(profile.must_change_password ? "/account/password" : homeFor(profile.role));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Write `ops/app/login/LoginForm.tsx`**

```tsx
"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import type { MessageKey } from "@/lib/i18n";

export function LoginForm({ labels }: { labels: Record<"username" | "password" | "submit", string> & { errors: Partial<Record<MessageKey, string>> } }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={labels.username} name="username" autoComplete="username" autoCapitalize="none" dir="ltr" required />
      <Field label={labels.password} name="password" type="password" autoComplete="current-password" dir="ltr" required />
      <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
      <Button type="submit" size="lg" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write `ops/app/login/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/roles";
import { getT } from "@/lib/i18n/server";
import { LOCALES } from "@/lib/i18n";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/account/password" : homeFor(user.role));
  const { locale, t } = await getT();
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="corner-accent hidden flex-col justify-between bg-navy-700 p-10 text-white md:flex">
        <span className="eyebrow text-royal-100">Al-Sakhra for Industry</span>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">{t("app.name")}</h1>
          <div className="mt-4 h-1 w-16 bg-royal-500" />
        </div>
        <span className="eyebrow text-royal-100">Al-Kharj · Riyadh</span>
      </section>
      <section className="flex flex-col items-center justify-center gap-8 p-6">
        <Logo className="w-40" />
        <div className="w-full max-w-sm border-t-4 border-royal-600 bg-white p-6 shadow-sm">
          <span className="eyebrow text-royal-600">{t("login.eyebrow")}</span>
          <h2 className="mb-6 mt-1 text-2xl font-bold text-navy-700">{t("login.title")}</h2>
          <LoginForm
            labels={{
              username: t("login.username"),
              password: t("login.password"),
              submit: t("login.submit"),
              errors: {
                "login.error_invalid": t("login.error_invalid"),
                "login.error_locked": t("login.error_locked"),
                "login.error_inactive": t("login.error_inactive"),
              },
            }}
          />
        </div>
        <LocaleSwitcher
          current={locale}
          labels={Object.fromEntries(LOCALES.map((l) => [l, t(`locale.${l}` as const)])) as Record<(typeof LOCALES)[number], string>}
        />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Write the locale action and switcher**

`ops/app/actions/locale.ts`:
```ts
"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

export async function setLocaleAction(fd: FormData): Promise<void> {
  const locale = fd.get("locale");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  if (await getCurrentUser()) {
    const supabase = await createClient();
    await supabase.rpc("set_my_locale", { p_locale: locale });
  }
  revalidatePath("/", "layout");
}
```

`ops/components/shell/LocaleSwitcher.tsx`:
```tsx
import { setLocaleAction } from "@/app/actions/locale";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LocaleSwitcher({ current, labels }: { current: Locale; labels: Record<Locale, string> }) {
  return (
    <form action={setLocaleAction} className="flex gap-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="submit"
          name="locale"
          value={l}
          aria-pressed={l === current}
          className={`px-3 py-1 text-sm ${l === current ? "bg-royal-600 text-white" : "text-navy-700 hover:bg-royal-50"}`}
        >
          {labels[l]}
        </button>
      ))}
    </form>
  );
}
```

- [ ] **Step 5: Write the forced password change**

`ops/app/account/password/actions.ts`:
```ts
"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireUser } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/roles";
import type { MessageKey } from "@/lib/i18n";

export type PasswordState = { error?: MessageKey };

export async function changePasswordAction(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const pw = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (pw.length < 8) return { error: "password.error_short" };
  if (pw !== confirm) return { error: "password.error_mismatch" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) return { error: "common.error_generic" };
  await supabase.rpc("clear_must_change_password");
  redirect(homeFor(user.role));
}
```

`ops/app/account/password/PasswordForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import type { MessageKey } from "@/lib/i18n";

export function PasswordForm({ labels }: { labels: { new: string; confirm: string; submit: string; errors: Partial<Record<MessageKey, string>> } }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={labels.new} name="password" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
      <Field label={labels.confirm} name="confirm" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
      <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
      <Button type="submit" size="lg" disabled={pending}>{labels.submit}</Button>
    </form>
  );
}
```

`ops/app/account/password/page.tsx`:
```tsx
import { requireUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Logo } from "@/components/brand/Logo";
import { PasswordForm } from "./PasswordForm";

export default async function PasswordPage() {
  await requireUser();
  const { t } = await getT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Logo variant="mark" className="w-16" />
      <div className="w-full max-w-sm border-t-4 border-royal-600 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-navy-700">{t("password.title")}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-500">{t("password.hint")}</p>
        <PasswordForm
          labels={{
            new: t("password.new"),
            confirm: t("password.confirm"),
            submit: t("password.submit"),
            errors: {
              "password.error_short": t("password.error_short"),
              "password.error_mismatch": t("password.error_mismatch"),
              "common.error_generic": t("common.error_generic"),
            },
          }}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Check by hand.** Run `npm run dev`, open `/login`, and sign in as `owner` with the temporary password from Task 6. You should land on `/account/password`; set a new password there. The redirect to `/admin/users` returns 404 until Task 10, which is expected. Then switch the language on `/login` and confirm the direction flips for English.

- [ ] **Step 7: Commit**

```bash
git add ops/app/login ops/app/account ops/app/actions ops/components/shell/LocaleSwitcher.tsx
git commit -m "feat(ops): add login with lockout, forced password change and language switcher"
```

---

### Task 9: App shell and role home screens

**Files:**
- Create: `ops/app/(app)/layout.tsx`, `ops/components/shell/AppHeader.tsx`
- Create: `ops/app/(app)/board/page.tsx`, `ops/app/(app)/warehouse/page.tsx`, `ops/app/(app)/driver/page.tsx`
- Modify: `ops/app/page.tsx` (redirect to the role's home)

**Interfaces:**
- Consumes: `requireUser`, `requireRole`, `NAV_BY_ROLE`, `homeFor`, `getT`, `logoutAction`, `LocaleSwitcher`.
- Produces: a shared shell for all signed-in pages, a role guard per page via `requireRole`, and `/board`, `/warehouse` and `/driver` routes that plans 2 and 3 replace.

- [ ] **Step 1: Write `ops/components/shell/AppHeader.tsx`**

```tsx
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { logoutAction } from "@/app/login/actions";
import { NAV_BY_ROLE } from "@/lib/auth/roles";
import { LOCALES, type Locale, type T } from "@/lib/i18n";
import type { CurrentUser } from "@/lib/auth/session";

export function AppHeader({ user, t, locale }: { user: CurrentUser; t: T; locale: Locale }) {
  return (
    <header className="bg-navy-700 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 bg-white px-2 py-1">
          <Logo variant="mark" className="h-8 w-8" />
          <span className="text-sm font-bold text-navy-700">{t("app.name")}</span>
        </Link>
        <nav className="flex flex-1 flex-wrap gap-1">
          {NAV_BY_ROLE[user.role].map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-1 px-3 py-2 text-sm hover:bg-navy-800">
              <Icon name={item.icon} className="text-xl" />
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">
            {user.fullName} · <span className="text-royal-100">{t(`role.${user.role}` as const)}</span>
          </span>
          <div className="bg-white">
            <LocaleSwitcher
              current={locale}
              labels={Object.fromEntries(LOCALES.map((l) => [l, t(`locale.${l}` as const)])) as Record<Locale, string>}
            />
          </div>
          <form action={logoutAction}>
            <button className="flex items-center gap-1 px-2 py-2 hover:bg-navy-800" aria-label={t("common.logout")}>
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </div>
      <div className="h-1 bg-royal-600" />
    </header>
  );
}
```

- [ ] **Step 2: Write `ops/app/(app)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { AppHeader } from "@/components/shell/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/account/password");
  const { t, locale } = await getT();
  return (
    <>
      <AppHeader user={user} t={t} locale={locale} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </>
  );
}
```

- [ ] **Step 3: Write the three home screens.** Each page guards its own roles, because layouts don't re-run on client navigation.

`ops/app/(app)/board/page.tsx`:
```tsx
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";

export default async function BoardPage() {
  const user = await requireRole(["admin", "sales"]);
  const { t } = await getT();
  return (
    <Card title={t("home.welcome", { name: user.fullName })} eyebrow="Dispatch">
      <p className="text-ink-500">{t("home.board_intro")}</p>
    </Card>
  );
}
```

`ops/app/(app)/warehouse/page.tsx`:
```tsx
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";

export default async function WarehousePage() {
  const user = await requireRole(["admin", "warehouse"]);
  const { t } = await getT();
  return (
    <Card title={t("home.welcome", { name: user.fullName })} eyebrow="Warehouse">
      <p className="text-ink-500">{t("home.warehouse_intro")}</p>
    </Card>
  );
}
```

`ops/app/(app)/driver/page.tsx`:
```tsx
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";

export default async function DriverPage() {
  const user = await requireRole(["driver"]);
  const { t } = await getT();
  return (
    <Card title={t("home.welcome", { name: user.fullName })} eyebrow="Deliveries">
      <p className="text-lg text-ink-500">{t("home.driver_intro")}</p>
    </Card>
  );
}
```

- [ ] **Step 4: Replace `ops/app/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/roles";

export default async function Home() {
  const user = await requireUser();
  redirect(user.mustChangePassword ? "/account/password" : homeFor(user.role));
}
```

- [ ] **Step 5: Build**

Run: `cd ops && npx tsc --noEmit && npx next build`
Expected: the build succeeds, and the route list includes `/board`, `/warehouse`, `/driver` and `/login`.

- [ ] **Step 6: Commit**

```bash
git add "ops/app/(app)" ops/app/page.tsx ops/components/shell/AppHeader.tsx
git commit -m "feat(ops): add branded app shell, role navigation and role home screens"
```

---

### Task 10: Admin — users, sales reps, failure reasons and warehouse location

**Files:**
- Create: `ops/lib/maps/parseMapsLink.ts`, `ops/lib/maps/resolveMapsLink.ts`
- Create: `ops/app/(app)/admin/users/page.tsx`, `CreateUserForm.tsx`, `UserRow.tsx`, `actions.ts`
- Create: `ops/app/(app)/admin/settings/page.tsx`, `RepsSection.tsx`, `ReasonsSection.tsx`, `WarehouseSection.tsx`, `actions.ts`
- Test: `ops/tests/unit/parseMapsLink.test.ts`

**Interfaces:**
- Consumes: `requireRole`, `createClient`, `dbErrorKey`, `getT`, the RPCs from Task 5.
- Produces:
  - `parseMapsLink(input: string): { lat: number; lng: number } | null`, which plan 2 reuses for branches.
  - `resolveMapsLink(input: string): Promise<{ lat: number; lng: number } | null>`, which follows short-link redirects.
  - `type ActionState = { ok?: boolean; error?: MessageKey }` for all admin actions.

- [ ] **Step 1: Write the failing test** at `ops/tests/unit/parseMapsLink.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { parseMapsLink } from "@/lib/maps/parseMapsLink";

describe("parseMapsLink", () => {
  it("prefers the !3d!4d place coordinates over the @ viewport", () => {
    expect(
      parseMapsLink("https://www.google.com/maps/place/Hussain+Top/@24.7000,46.6000,15z/data=!4m6!3m5!1s0x0:0x0!8m2!3d24.7531!4d46.7212"),
    ).toEqual({ lat: 24.7531, lng: 46.7212 });
  });
  it("reads the @lat,lng viewport", () => {
    expect(parseMapsLink("https://www.google.com/maps/@24.7136,46.6753,17z")).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
  it("reads q= and query= parameters", () => {
    expect(parseMapsLink("https://maps.google.com/?q=24.71,46.67")).toEqual({ lat: 24.71, lng: 46.67 });
    expect(parseMapsLink("https://www.google.com/maps/search/?api=1&query=24.71%2C46.67")).toEqual({ lat: 24.71, lng: 46.67 });
  });
  it("reads raw coordinates", () => {
    expect(parseMapsLink(" 24.7136, 46.6753 ")).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
  it("rejects garbage and out-of-range values", () => {
    expect(parseMapsLink("hello")).toBeNull();
    expect(parseMapsLink("124.7, 46.6")).toBeNull();
    expect(parseMapsLink("https://maps.app.goo.gl/abc123")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd ops && npx vitest run tests/unit/parseMapsLink.test.ts`
Expected: FAIL with a module-not-found error.

- [ ] **Step 3: Implement the maps helpers**

`ops/lib/maps/parseMapsLink.ts`:
```ts
export type LatLng = { lat: number; lng: number };

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

function valid(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseMapsLink(input: string): LatLng | null {
  const s = decodeURIComponent(input.trim());
  const patterns = [
    new RegExp(`!3d${NUM}!4d${NUM}`),
    new RegExp(`[?&](?:q|query|ll|destination)=${NUM},\\s*${NUM}`),
    new RegExp(`@${NUM},${NUM}`),
    new RegExp(`^${NUM},\\s*${NUM}$`),
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return valid(parseFloat(m[1]), parseFloat(m[2]));
  }
  return null;
}
```

`ops/lib/maps/resolveMapsLink.ts`:
```ts
import "server-only";
import { parseMapsLink, type LatLng } from "./parseMapsLink";

const SHORT_HOSTS = ["maps.app.goo.gl", "goo.gl"];

/** Parses a Google Maps link; follows up to 5 redirects for short links like maps.app.goo.gl. */
export async function resolveMapsLink(input: string): Promise<LatLng | null> {
  const direct = parseMapsLink(input);
  if (direct) return direct;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (!SHORT_HOSTS.includes(url.hostname)) return null;
  let current = url.toString();
  for (let i = 0; i < 5; i++) {
    const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    const next = res.headers.get("location");
    if (!next) return null;
    const parsed = parseMapsLink(next);
    if (parsed) return parsed;
    current = new URL(next, current).toString();
  }
  return null;
}
```

Run: `cd ops && npx vitest run tests/unit/parseMapsLink.test.ts`
Expected: 5 tests pass.

- [ ] **Step 4: Write `ops/app/(app)/admin/users/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { isLocale, type MessageKey } from "@/lib/i18n";
import { ROLES, type Role } from "@/lib/orders/status";

export type ActionState = { ok?: boolean; error?: MessageKey };

function asRole(v: FormDataEntryValue | null): Role | null {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v) ? (v as Role) : null;
}

export async function createUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const role = asRole(fd.get("role"));
  const locale = fd.get("locale");
  if (!role || !isLocale(locale)) return { error: "common.error_generic" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_user", {
    p_username: String(fd.get("username") ?? ""),
    p_full_name: String(fd.get("full_name") ?? ""),
    p_role: role,
    p_locale: locale,
    p_password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const role = asRole(fd.get("role"));
  const locale = fd.get("locale");
  if (!role || !isLocale(locale)) return { error: "common.error_generic" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_user", {
    p_user_id: String(fd.get("user_id")),
    p_full_name: String(fd.get("full_name") ?? ""),
    p_role: role,
    p_locale: locale,
    p_active: fd.get("active") === "on",
  });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetPasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reset_password", {
    p_user_id: String(fd.get("user_id")),
    p_password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: dbErrorKey(error.message) };
  return { ok: true };
}
```

- [ ] **Step 5: Write the user forms**

`ops/app/(app)/admin/users/CreateUserForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { createUserAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import type { MessageKey } from "@/lib/i18n";

export type UserFormLabels = {
  username: string; fullName: string; role: string; locale: string; password: string; submit: string; created: string;
  roles: Record<string, string>; locales: Record<string, string>; errors: Partial<Record<MessageKey, string>>;
};

export function CreateUserForm({ labels }: { labels: UserFormLabels }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createUserAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-5 md:items-end">
      <Field label={labels.username} name="username" dir="ltr" autoCapitalize="none" required />
      <Field label={labels.fullName} name="full_name" required />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.role}</span>
        <select name="role" className="h-11 border border-mist-300 bg-white px-2" defaultValue="driver">
          {Object.entries(labels.roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-700">{labels.locale}</span>
        <select name="locale" className="h-11 border border-mist-300 bg-white px-2" defaultValue="ar">
          {Object.entries(labels.locales).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <Field label={labels.password} name="password" dir="ltr" minLength={8} required />
      <div className="md:col-span-5 flex items-center gap-4">
        <Button type="submit" disabled={pending}>{labels.submit}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.created : null}</FormMessage>
      </div>
    </form>
  );
}
```

`ops/app/(app)/admin/users/UserRow.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { resetPasswordAction, updateUserAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import type { UserFormLabels } from "./CreateUserForm";

export type UserRowData = { user_id: string; username: string; full_name: string; role: string; locale: string; active: boolean };

export function UserRow({ u, labels }: { u: UserRowData; labels: UserFormLabels & { save: string; active: string; reset: string; resetDone: string; saved: string } }) {
  const [upd, updAction, updPending] = useActionState<ActionState, FormData>(updateUserAction, {});
  const [rst, rstAction, rstPending] = useActionState<ActionState, FormData>(resetPasswordAction, {});
  return (
    <li className="flex flex-col gap-3 border-b border-mist-200 py-4">
      <form action={updAction} className="grid gap-3 md:grid-cols-6 md:items-center">
        <input type="hidden" name="user_id" value={u.user_id} />
        <span dir="ltr" className="font-mono text-sm text-ink-700">{u.username}</span>
        <input name="full_name" defaultValue={u.full_name} className="h-10 border border-mist-300 px-2" aria-label={labels.fullName} />
        <select name="role" defaultValue={u.role} className="h-10 border border-mist-300 bg-white px-2" aria-label={labels.role}>
          {Object.entries(labels.roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="locale" defaultValue={u.locale} className="h-10 border border-mist-300 bg-white px-2" aria-label={labels.locale}>
          {Object.entries(labels.locales).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={u.active} /> {labels.active}
        </label>
        <Button type="submit" variant="secondary" disabled={updPending}>{labels.save}</Button>
      </form>
      <form action={rstAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="user_id" value={u.user_id} />
        <input name="password" dir="ltr" minLength={8} required placeholder={labels.password}
          className="h-9 w-56 border border-mist-300 px-2 text-sm" aria-label={labels.password} />
        <Button type="submit" variant="ghost" disabled={rstPending}>{labels.reset}</Button>
        <FormMessage kind="error">{(upd.error && labels.errors[upd.error]) || (rst.error && labels.errors[rst.error]) || null}</FormMessage>
        <FormMessage kind="success">{rst.ok ? labels.resetDone : upd.ok ? labels.saved : null}</FormMessage>
      </form>
    </li>
  );
}
```

`ops/app/(app)/admin/users/page.tsx`:
```tsx
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getT } from "@/lib/i18n/server";
import { LOCALES } from "@/lib/i18n";
import { ROLES } from "@/lib/orders/status";
import { Card } from "@/components/ui/Card";
import { CreateUserForm, type UserFormLabels } from "./CreateUserForm";
import { UserRow } from "./UserRow";

export default async function UsersPage() {
  await requireRole(["admin"]);
  const { t } = await getT();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, role, locale, active")
    .order("role")
    .order("username");

  const labels: UserFormLabels = {
    username: t("users.username"), fullName: t("users.full_name"), role: t("users.role"),
    locale: t("users.locale"), password: t("users.temp_password"), submit: t("users.create"), created: t("users.created"),
    roles: Object.fromEntries(ROLES.map((r) => [r, t(`role.${r}` as const)])),
    locales: Object.fromEntries(LOCALES.map((l) => [l, t(`locale.${l}` as const)])),
    errors: {
      "users.error_taken": t("users.error_taken"),
      "users.error_invalid_username": t("users.error_invalid_username"),
      "users.error_weak_password": t("users.error_weak_password"),
      "users.error_self": t("users.error_self"),
      "common.not_authorized": t("common.not_authorized"),
      "common.error_generic": t("common.error_generic"),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title={t("users.create")} eyebrow={t("users.eyebrow")}>
        <CreateUserForm labels={labels} />
      </Card>
      <Card title={t("users.title")}>
        <ul>
          {(users ?? []).map((u) => (
            <UserRow
              key={u.user_id}
              u={u}
              labels={{ ...labels, save: t("common.save"), active: t("common.active"), reset: t("users.reset_password"),
                resetDone: t("users.password_reset_done"), saved: t("common.saved") }}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Write `ops/app/(app)/admin/settings/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { resolveMapsLink } from "@/lib/maps/resolveMapsLink";
import type { ActionState } from "../users/actions";

const done = (): ActionState => {
  revalidatePath("/admin/settings");
  return { ok: true };
};

export async function addRepAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "common.error_generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("sales_reps").insert({ name });
  return error ? { error: dbErrorKey(error.message) } : done();
}

export async function toggleRepAction(fd: FormData): Promise<void> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  await supabase.from("sales_reps").update({ active: fd.get("active") === "true" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/settings");
}

export async function saveReasonAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const row = {
    code: String(fd.get("code") ?? "").trim(),
    label_ar: String(fd.get("label_ar") ?? "").trim(),
    label_en: String(fd.get("label_en") ?? "").trim(),
    label_ur: String(fd.get("label_ur") ?? "").trim(),
    icon: String(fd.get("icon") ?? "").trim(),
    sort: Number(fd.get("sort") ?? 0),
    active: fd.get("active") === "on",
  };
  if (!row.code || !row.label_ar || !row.label_en || !row.label_ur || !row.icon) return { error: "common.error_generic" };
  const supabase = await createClient();
  const id = fd.get("id");
  const { error } = id
    ? await supabase.from("failure_reasons").update(row).eq("id", String(id))
    : await supabase.from("failure_reasons").insert(row);
  return error ? { error: dbErrorKey(error.message) } : done();
}

export async function saveWarehouseAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const name = String(fd.get("name") ?? "").trim();
  const link = String(fd.get("location") ?? "").trim();
  const update: { name: string; lat?: number; lng?: number } = { name };
  if (link) {
    const pos = await resolveMapsLink(link);
    if (!pos) return { error: "settings.error_maps_link" };
    update.lat = pos.lat;
    update.lng = pos.lng;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("warehouses").update(update).eq("id", String(fd.get("id")));
  return error ? { error: dbErrorKey(error.message) } : done();
}
```

- [ ] **Step 7: Write the settings sections and page**

`ops/app/(app)/admin/settings/RepsSection.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { addRepAction, toggleRepAction } from "./actions";
import type { ActionState } from "../users/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";

export function RepsSection({ reps, labels }: {
  reps: { id: string; name: string; active: boolean }[];
  labels: { name: string; add: string; active: string; inactive: string; error?: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addRepAction, {});
  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="w-64"><Field label={labels.name} name="name" required /></div>
        <Button type="submit" disabled={pending}>{labels.add}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
      </form>
      <ul className="flex flex-wrap gap-2">
        {reps.map((r) => (
          <li key={r.id}>
            <form action={toggleRepAction}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="active" value={String(!r.active)} />
              <button className={`border px-3 py-1 text-sm ${r.active ? "border-royal-600 text-navy-700" : "border-mist-300 text-ink-500 line-through"}`}
                title={r.active ? labels.active : labels.inactive}>
                {r.name}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`ops/app/(app)/admin/settings/ReasonsSection.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { saveReasonAction } from "./actions";
import type { ActionState } from "../users/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Icon } from "@/components/ui/Icon";

type Reason = { id: string; code: string; label_ar: string; label_en: string; label_ur: string; icon: string; sort: number; active: boolean };
type Labels = { code: string; ar: string; en: string; ur: string; icon: string; sort: string; active: string; save: string; add: string; saved: string; errors: Record<string, string> };

function ReasonForm({ r, labels }: { r?: Reason; labels: Labels }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveReasonAction, {});
  const input = "h-9 border border-mist-300 px-2 text-sm";
  return (
    <form action={action} className="grid items-center gap-2 border-b border-mist-200 py-3 md:grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_70px_80px_auto]">
      {r && <input type="hidden" name="id" value={r.id} />}
      <Icon name={r?.icon ?? "add"} className="text-2xl text-royal-600" />
      <input name="code" defaultValue={r?.code} aria-label={labels.code} placeholder={labels.code} dir="ltr" className={input} required />
      <input name="label_ar" defaultValue={r?.label_ar} aria-label={labels.ar} placeholder={labels.ar} dir="rtl" className={input} required />
      <input name="label_en" defaultValue={r?.label_en} aria-label={labels.en} placeholder={labels.en} dir="ltr" className={input} required />
      <input name="label_ur" defaultValue={r?.label_ur} aria-label={labels.ur} placeholder={labels.ur} dir="rtl" className={input} required />
      <input name="icon" defaultValue={r?.icon} aria-label={labels.icon} placeholder={labels.icon} dir="ltr" className={input} required />
      <input name="sort" type="number" defaultValue={r?.sort ?? 0} aria-label={labels.sort} className={input} />
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={r?.active ?? true} />{labels.active}</label>
      <div className="flex items-center gap-2">
        <Button type="submit" variant={r ? "secondary" : "primary"} disabled={pending}>{r ? labels.save : labels.add}</Button>
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
      </div>
    </form>
  );
}

export function ReasonsSection({ reasons, labels }: { reasons: Reason[]; labels: Labels }) {
  return (
    <div>
      {reasons.map((r) => <ReasonForm key={r.id} r={r} labels={labels} />)}
      <ReasonForm labels={labels} />
    </div>
  );
}
```

`ops/app/(app)/admin/settings/WarehouseSection.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { saveWarehouseAction } from "./actions";
import type { ActionState } from "../users/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";

export function WarehouseSection({ w, labels }: {
  w: { id: string; name: string; lat: number | null; lng: number | null };
  labels: { name: string; link: string; save: string; saved: string; location: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveWarehouseAction, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
      <input type="hidden" name="id" value={w.id} />
      <Field label={labels.name} name="name" defaultValue={w.name} required />
      <Field label={labels.link} name="location" dir="ltr" placeholder="https://maps.app.goo.gl/…" />
      <Button type="submit" disabled={pending}>{labels.save}</Button>
      <p className="text-sm text-ink-500 md:col-span-3" dir="auto">{labels.location}</p>
      <div className="md:col-span-3">
        <FormMessage kind="error">{state.error ? labels.errors[state.error] : null}</FormMessage>
        <FormMessage kind="success">{state.ok ? labels.saved : null}</FormMessage>
      </div>
    </form>
  );
}
```

`ops/app/(app)/admin/settings/page.tsx`:
```tsx
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";
import { RepsSection } from "./RepsSection";
import { ReasonsSection } from "./ReasonsSection";
import { WarehouseSection } from "./WarehouseSection";

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const { t } = await getT();
  const supabase = await createClient();
  const [{ data: reps }, { data: reasons }, { data: warehouses }] = await Promise.all([
    supabase.from("sales_reps").select("id, name, active").order("name"),
    supabase.from("failure_reasons").select("id, code, label_ar, label_en, label_ur, icon, sort, active").order("sort"),
    supabase.from("warehouses").select("id, name, lat, lng").order("created_at").limit(1),
  ]);
  const errors = {
    "common.error_generic": t("common.error_generic"),
    "common.not_authorized": t("common.not_authorized"),
    "settings.error_rep_taken": t("settings.error_rep_taken"),
    "settings.error_maps_link": t("settings.error_maps_link"),
  };
  const w = warehouses?.[0];
  return (
    <div className="flex flex-col gap-6">
      {w && (
        <Card title={t("settings.warehouse")} eyebrow="Depot">
          <WarehouseSection
            w={w}
            labels={{
              name: t("settings.warehouse_name"), link: t("settings.maps_link"), save: t("common.save"), saved: t("common.saved"),
              location: w.lat != null && w.lng != null ? t("settings.location_set", { lat: w.lat.toFixed(5), lng: w.lng.toFixed(5) }) : t("settings.location_missing"),
              errors,
            }}
          />
        </Card>
      )}
      <Card title={t("settings.reps")} eyebrow="Sales reps">
        <RepsSection reps={reps ?? []} labels={{ name: t("settings.rep_name"), add: t("common.add"), active: t("common.active"), inactive: t("common.inactive"), errors }} />
      </Card>
      <Card title={t("settings.reasons")} eyebrow="Delivery">
        <ReasonsSection
          reasons={reasons ?? []}
          labels={{ code: t("settings.reason_code"), ar: t("settings.reason_label_ar"), en: t("settings.reason_label_en"), ur: t("settings.reason_label_ur"),
            icon: t("settings.reason_icon"), sort: t("settings.reason_sort"), active: t("common.active"), save: t("common.save"),
            add: t("common.add"), saved: t("common.saved"), errors }}
        />
      </Card>
    </div>
  );
}
```

- [ ] **Step 8: Type-check, test and build**

Run: `cd ops && npx tsc --noEmit && npx vitest run && npx next build`
Expected: no errors; all unit tests pass; the build lists `/admin/users` and `/admin/settings`.

- [ ] **Step 9: Commit**

```bash
git add "ops/app/(app)/admin" ops/lib/maps ops/tests/unit/parseMapsLink.test.ts
git commit -m "feat(ops): add admin user management and settings for reps, reasons and warehouse"
```

---

### Task 11: End-to-end check against the live project, with screenshots

**Files:**
- Create: `ops/playwright.config.ts`, `ops/tests/e2e/admin.spec.ts`

**Interfaces:**
- Consumes: the live Supabase project (Task 6) and the `owner` account, with its password already changed in Task 8 Step 6.
- Produces: a passing e2e run and screenshots in the scratchpad to show the user.

- [ ] **Step 1: Write `ops/playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3200", viewport: { width: 1366, height: 900 } },
  webServer: { command: "npm run start", port: 3200, reuseExistingServer: true, timeout: 120_000 },
});
```

Playwright is pre-installed globally. If `@playwright/test` can't be resolved, add it as a devDependency pinned to the globally installed version (`npm ls -g @playwright/test` or `node -e "console.log(require('playwright/package.json').version)"`). Never run `playwright install`.

- [ ] **Step 2: Write `ops/tests/e2e/admin.spec.ts`.** It reads credentials from the environment and never hard-codes them.

```ts
import { expect, test } from "@playwright/test";

const ADMIN_USER = process.env.E2E_ADMIN_USER!;
const ADMIN_PASS = process.env.E2E_ADMIN_PASS!;
const SHOTS = process.env.E2E_SHOTS_DIR;

test("admin signs in, creates a driver, driver lands on driver home", async ({ page, browser }) => {
  const driverName = `e2e${Date.now().toString().slice(-6)}`;

  await page.goto("/login");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/01-login-ar.png` });
  await page.getByLabel("اسم المستخدم").fill(ADMIN_USER);
  await page.getByLabel("كلمة المرور").fill(ADMIN_PASS);
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL(/\/admin\/users/);

  await page.locator('input[name="username"]').first().fill(driverName);
  await page.locator('input[name="full_name"]').first().fill("سائق تجربة");
  await page.locator('select[name="role"]').first().selectOption("driver");
  await page.locator('select[name="locale"]').first().selectOption("ur");
  await page.locator('input[name="password"]').first().fill("temp-pass-123");
  await page.getByRole("button", { name: "إنشاء حساب" }).click();
  await expect(page.getByText(driverName)).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/02-admin-users.png`, fullPage: true });

  await page.goto("/admin/settings");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/03-admin-settings.png`, fullPage: true });

  // New driver: forced password change, then Urdu RTL driver home
  const ctx = await browser.newContext();
  const d = await ctx.newPage();
  await d.goto("/login");
  await d.locator('input[name="username"]').fill(driverName);
  await d.locator('input[name="password"]').fill("temp-pass-123");
  await d.locator('button[type="submit"]').click();
  await expect(d).toHaveURL(/\/account\/password/);
  await d.locator('input[name="password"]').fill("driver-pass-123");
  await d.locator('input[name="confirm"]').fill("driver-pass-123");
  await d.locator('button[type="submit"]').click();
  await expect(d).toHaveURL(/\/driver/);
  await expect(d.locator("html")).toHaveAttribute("lang", "ur");
  await expect(d.locator("html")).toHaveAttribute("dir", "rtl");
  if (SHOTS) await d.screenshot({ path: `${SHOTS}/04-driver-home-ur.png` });

  // Driver cannot open admin pages
  await d.goto("/admin/users");
  await expect(d).toHaveURL(/\/driver/);
  await ctx.close();

  // Admin deactivates the test driver so it can't be used
  await page.goto("/admin/users");
  const row = page.locator("li", { hasText: driverName });
  await row.locator('input[name="active"]').uncheck();
  await row.getByRole("button", { name: "حفظ" }).click();
});
```

- [ ] **Step 3: Run it**

Run: `cd ops && npx next build && E2E_ADMIN_USER=owner E2E_ADMIN_PASS='<owner password>' E2E_SHOTS_DIR=/tmp/claude-0/-home-user-al-sakhrah-ecommerce/7efe3e9b-4803-5fec-8502-0eb2cfa15c3c/scratchpad npx playwright test --trace off`
Expected: 1 passed. Four screenshots are written to the scratchpad. Look at every screenshot: check the brand colours, logo, fonts, RTL alignment, and that no English strings appear on Arabic screens.

- [ ] **Step 4: Run all the checks**

Run: `cd ops && npx vitest run && npm run test:sql && npx tsc --noEmit && npx eslint .`
Expected: everything passes.

- [ ] **Step 5: Commit and push**

```bash
git add ops/playwright.config.ts ops/tests/e2e
git commit -m "test(ops): add end-to-end admin and driver onboarding test"
git push -u origin feature/logistics-platform
```

---

## Done criteria for Plan 1

- The `owner` admin can sign in, is forced to change the temporary password, can create users for all four roles, reset passwords, deactivate accounts, manage sales reps and failure reasons, and set the warehouse location from a Google Maps link.
- Each role lands on its own home screen, can't open other roles' pages, and sees the UI in its chosen language (ar/en/ur, with correct direction).
- SQL tests prove the order state machine, RLS isolation (driver, warehouse, sales, anon) and account security.
- Screenshots of the login, users, settings and Urdu driver home screens have been reviewed and shared with the user.
