import Link from "next/link";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-brand-900 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`border border-ink/10 bg-white ${className}`}>{children}</section>;
}

export function Badge({ tone = "neutral", children }: { tone?: "ok" | "warn" | "bad" | "neutral" | "brand"; children: React.ReactNode }) {
  const tones = {
    ok: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-800",
    bad: "bg-red-50 text-red-700",
    neutral: "bg-surface text-ink/70",
    brand: "bg-brand-100 text-brand-900",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Chips({ items, current, base, param = "dept" }: {
  items: { value: string; label: string }[];
  current: string;
  base: string;
  param?: string;
}) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      {items.map((c) => {
        const on = c.value === current;
        const href = c.value ? `${base}${base.includes("?") ? "&" : "?"}${param}=${encodeURIComponent(c.value)}` : base;
        return (
          <Link key={c.value || "all"} href={href} className={`px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "bg-brand-900 text-white" : "bg-white text-brand-900 ring-1 ring-ink/10 hover:bg-brand-100"}`}>
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-ink/15 bg-white p-8 text-center text-ink/55">{children}</p>;
}

export function Stat({ label, value, href, hint }: { label: string; value: React.ReactNode; href?: string; hint?: string }) {
  const body = (
    <>
      <p className="text-sm font-semibold text-ink/60">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-brand-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </>
  );
  const cls = "block border border-ink/10 bg-white p-5 transition-colors";
  return href ? <Link href={href} className={`${cls} hover:border-brand-700/40 hover:bg-brand-100/40`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** The company header shown only on printed pages. */
export function PrintHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="print-only mb-6 border-b-2 border-brand-900 pb-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-color.png" alt="" className="mb-2 h-12 w-auto" />
      <p className="text-lg font-bold">{title}</p>
      <p className="text-sm">{sub}</p>
    </div>
  );
}
