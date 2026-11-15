import Link from "next/link";
import { ArrowLeft, ArrowRight, Inbox, type LucideIcon } from "lucide-react";
import { getLang, makeT } from "@/lib/i18n";

/** Grayscale photo washed with brand blue, as on alsakhrah.com. Decorative. */
export function TintedPhoto({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`photo-tint ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
    </div>
  );
}

/** Small uppercase label with a rule, the website's section eyebrow. */
export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-brand-200" : "text-brand-700"}`}>
      <span className={`h-[2px] w-8 ${light ? "bg-brand-200" : "bg-brand-700"}`} />
      {children}
    </p>
  );
}

/**
 * Page banner in the website's hero style: dark blue, a tinted factory photo,
 * the logo mark as a watermark, an eyebrow, the title and optional actions.
 */
export async function PageHeader({ title, subtitle, actions, eyebrow, image = "/images/cover.jpg", back, children }: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  image?: string;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  const t = makeT(await getLang());
  return (
    <header className="page-hero rise relative isolate mb-8 overflow-hidden bg-brand-900 px-6 py-8 text-white md:px-10 md:py-10">
      <TintedPhoto src={image} className="-z-10 opacity-50" />
      <div className="hero-deco pattern-lines absolute inset-0 -z-10" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mark-white.png" alt="" aria-hidden className="hero-deco pointer-events-none absolute -bottom-16 -end-10 -z-10 w-64 max-w-none opacity-[0.08]" />
      {back && (
        <Link href={back.href} className="no-print mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/75 transition-colors hover:text-white">
          <ArrowRight size={16} className="ltr:rotate-180" /> {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Eyebrow light>{eyebrow ?? `${t("appName")} · ${t("company")}`}</Eyebrow>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-balance md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">{subtitle}</p>}
          {children && <div className="mt-4">{children}</div>}
        </div>
        {actions && <div className="no-print flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`border border-ink/10 bg-white shadow-sm shadow-brand-950/[0.03] ${className}`}>{children}</section>;
}

/** Card heading bar: icon tile, title and an optional count or action. */
export function CardTitle({ icon: I, children, count, action }: { icon?: LucideIcon; children: React.ReactNode; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-3.5">
      {I && <span className="grid h-9 w-9 shrink-0 place-items-center bg-brand-100 text-brand-700"><I size={18} strokeWidth={1.75} /></span>}
      <h2 className="min-w-0 flex-1 font-bold text-brand-900">
        {children}
        {count !== undefined && <span className="ms-2 text-sm font-semibold tabular-nums text-ink/45">({count})</span>}
      </h2>
      {action}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "ok" | "warn" | "bad" | "neutral" | "brand"; children: React.ReactNode }) {
  const tones = {
    ok: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    warn: "bg-amber-50 text-amber-800 ring-amber-600/25",
    bad: "bg-red-50 text-red-700 ring-red-600/20",
    neutral: "bg-surface text-ink/70 ring-ink/10",
    brand: "bg-brand-100 text-brand-900 ring-brand-700/15",
  };
  const dot = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500", neutral: "bg-ink/30", brand: "bg-brand-700" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 ${dot[tone]}`} aria-hidden />
      {children}
    </span>
  );
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
          <Link
            key={c.value || "all"}
            href={href}
            aria-current={on ? "true" : undefined}
            className={`px-3.5 py-2 text-sm font-semibold transition-colors ${on ? "bg-brand-900 text-white shadow-md shadow-brand-900/20" : "bg-white text-brand-900 ring-1 ring-ink/10 hover:bg-brand-100"}`}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 border border-dashed border-ink/15 bg-white px-6 py-14 text-center text-ink/55">
      <span className="grid h-12 w-12 place-items-center bg-brand-100 text-brand-700"><Inbox size={22} strokeWidth={1.75} /></span>
      <p>{children}</p>
    </div>
  );
}

/**
 * Number tile. With a link it behaves like the website's product cards:
 * the whole tile turns dark blue on hover.
 */
export function Stat({ label, value, href, hint, icon: I }: { label: string; value: React.ReactNode; href?: string; hint?: string; icon?: LucideIcon }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink/60 transition-colors group-hover:text-white/75">{label}</p>
        {I && (
          <span className="grid h-10 w-10 shrink-0 place-items-center bg-brand-100 text-brand-700 transition-colors group-hover:bg-white/10 group-hover:text-white">
            <I size={20} strokeWidth={1.75} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-brand-900 transition-colors group-hover:text-white"><bdi>{value}</bdi></p>
      {hint && <p className="mt-1 text-xs text-ink/50 transition-colors group-hover:text-white/60">{hint}</p>}
      {href && <ArrowLeft size={16} className="mt-3 text-brand-700 transition-all group-hover:text-white ltr:rotate-180 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />}
    </>
  );
  const cls = "group block border border-ink/10 bg-white p-5 shadow-sm shadow-brand-950/[0.03] transition-colors";
  return href ? <Link href={href} className={`${cls} hover:border-brand-900 hover:bg-brand-900`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Progress bar with a label and percentage. */
export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-brand-900">{label}</span>
        <span className="tabular-nums text-ink/70" dir="ltr">{value} / {max} · {pct}%</span>
      </div>
      <div className="mt-2 h-2.5 bg-brand-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full bg-brand-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
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
