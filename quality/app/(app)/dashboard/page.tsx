import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, BookOpen, ClipboardCheck, FileCheck2, FileText, Files, Gauge, Handshake, ListTree, Share2, Stamp, CheckCircle2,
} from "lucide-react";
import { Card, CardTitle, Badge, Eyebrow, Progress, Stat, TintedPhoto } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { getClauses, getCopies, getDepartments, getDocuments, getEvidence, getForms, reviewState } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";

export default async function Home() {
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [docs, forms, clauses, evidence, copies, depts, user] = await Promise.all([
    getDocuments(), getForms(), getClauses(), getEvidence(), getCopies(), getDepartments(), getCurrentUser(),
  ]);

  const active = docs.filter((d) => d.status === "active");
  const sops = active.filter((d) => d.doc_type === "sop");
  const manual = active.find((d) => d.doc_type === "manual");
  const withEvidence = new Set(evidence.map((e) => e.clause_number));
  const done = clauses.filter((c) => withEvidence.has(c.number) || (c.assessor_notes ?? "").trim()).length;
  const distributed = copies.filter((c) => c.status === "distributed");
  const cancelled = copies.filter((c) => c.status === "cancelled");
  const due = active
    .filter((d) => reviewState(d) === "due" || reviewState(d) === "soon")
    .sort((a, b) => (a.next_review_at ?? "").localeCompare(b.next_review_at ?? ""));
  const holding = depts
    .filter((d) => d.holds_copies)
    .map((d) => ({ d, n: distributed.filter((c) => c.department === d.code).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const maxHeld = Math.max(1, ...holding.map((h) => h.n));
  const today = new Date().toLocaleDateString(ar ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const kpis = [
    { icon: FileText, label: t("documents"), value: sops.length, href: "/dashboard/documents" },
    { icon: Files, label: ar ? "النماذج والسجلات" : "Forms & records", value: forms.length, href: "/dashboard/sop-index" },
    { icon: Share2, label: ar ? "نسخ موزعة" : "Issued copies", value: distributed.length, href: "/dashboard/distribution" },
    { icon: ClipboardCheck, label: t("clauses"), value: `${done}/${clauses.length}`, href: "/dashboard/clauses" },
  ];

  const modules = [
    { icon: ListTree, href: "/dashboard/sop-index", title: t("sopIndex"), body: ar ? "كل إجراء ومعه نماذجه، مرتبة حسب القسم." : "Every procedure with its forms, by department." },
    { icon: FileCheck2, href: "/dashboard/doc-control", title: t("docControl"), body: ar ? "النسخ المعتمدة، الإصدار والسحب، والنسخ الملغاة." : "Approved versions, issue and withdrawal, cancelled copies." },
    { icon: ClipboardCheck, href: "/dashboard/clauses", title: t("clauses"), body: ar ? "متطلبات الهيئة وأدلة الالتزام بكل بند." : "Regulator requirements and the evidence for each." },
    { icon: Stamp, href: "/dashboard/general", title: t("general"), body: ar ? "التراخيص والسجلات والشهادات الرسمية." : "Licences, registrations and official certificates." },
    { icon: Gauge, href: "/dashboard/calibration", title: t("calibration"), body: ar ? "شهادات معايرة الأجهزة والموازين." : "Calibration certificates for instruments." },
    { icon: Handshake, href: "/dashboard/contracts", title: t("contracts"), body: ar ? "عقود الخدمات الخارجية." : "External service contracts." },
  ];

  return (
    <>
      {/* Welcome hero with the key numbers, like the website's hero and certification strip */}
      <section className="page-hero rise relative isolate mb-8 overflow-hidden bg-brand-900 text-white">
        <TintedPhoto src="/images/cover.jpg" className="-z-10 opacity-60" />
        <div className="hero-deco pattern-lines absolute inset-0 -z-10" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark-white.png" alt="" aria-hidden className="hero-deco pointer-events-none absolute -bottom-20 -end-16 -z-10 w-[420px] max-w-none opacity-[0.07]" />
        <div className="grid items-center gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Eyebrow light>{today}</Eyebrow>
            <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
              {ar ? "مرحبًا، " : "Welcome, "}{user?.fullName}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">
              {ar
                ? "نظام إدارة الجودة في مصنع الصخرة للصناعة: الإجراءات المعتمدة، ضبط الوثائق، والتقييم الذاتي في مكان واحد."
                : "AlSakhra's quality management system: approved procedures, document control and self-assessment in one place."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/sop-index" className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 font-semibold text-brand-900 transition-colors hover:bg-brand-100">
                {t("sopIndex")} <ArrowLeft size={18} className="ltr:rotate-180" />
              </Link>
              {manual && (
                <Link href={`/dashboard/documents/${manual.id}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10">
                  <BookOpen size={18} /> {t("manual")}
                </Link>
              )}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="" aria-hidden className="hero-deco mx-auto hidden h-56 w-auto lg:block" />
        </div>
        <div className="grid grid-cols-2 border-t border-white/15 bg-brand-950/60 backdrop-blur-sm lg:grid-cols-4">
          {kpis.map((k) => (
            <Link key={k.href} href={k.href} className="group flex items-center gap-3 border-white/10 px-5 py-5 transition-colors hover:bg-white/10 md:px-8 [&:not(:last-child)]:border-e">
              <k.icon size={26} strokeWidth={1.5} className="shrink-0 text-brand-200" />
              <div className="min-w-0">
                <p className="text-2xl font-bold tabular-nums text-white" dir="ltr">{k.value}</p>
                <p className="truncate text-xs text-white/65">{k.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {due.length > 0 && (
        <Card className="rise-2 mb-8 border-amber-300 border-s-4 border-s-amber-500">
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3.5 font-bold text-amber-900">
            <span className="grid h-9 w-9 place-items-center bg-amber-100 text-amber-700"><AlertTriangle size={18} /></span>
            {ar ? `مراجعات مستحقة (${due.length})` : `Reviews due (${due.length})`}
            <span className="ms-auto text-xs font-semibold text-amber-800/70">{ar ? "تُراجع الإجراءات كل سنتين من تاريخ الإصدار" : "Procedures are reviewed every 2 years from issue"}</span>
          </div>
          <ul className="divide-y divide-ink/10">
            {due.slice(0, 8).map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/documents/${d.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-amber-50/60">
                  <span className="min-w-0 flex-1 font-semibold text-brand-900">{pick(d, "title", lang)} <span className="ms-1 text-xs font-normal text-ink/50" dir="ltr">{d.code}</span></span>
                  <Badge tone={reviewState(d) === "due" ? "bad" : "warn"}>{reviewState(d) === "due" ? (ar ? "متأخرة" : "Overdue") : (ar ? "قريبًا" : "Soon")}</Badge>
                  <span className="w-24 text-end tabular-nums text-ink/60" dir="ltr">{d.next_review_at}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Quick access, in the website's product-card style */}
      <section className="rise-2 mb-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Eyebrow>{ar ? "الوصول السريع" : "Quick access"}</Eyebrow>
            <h2 className="mt-2 text-2xl font-bold text-brand-900">{ar ? "أقسام النظام" : "System sections"}</h2>
          </div>
        </div>
        <div className="grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link key={m.href} href={m.href} className="group bg-white p-6 transition-colors hover:bg-brand-900">
              <span className="grid h-12 w-12 place-items-center bg-brand-100 text-brand-700 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <m.icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-brand-900 transition-colors group-hover:text-white">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60 transition-colors group-hover:text-white/75">{m.body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors group-hover:text-white">
                {ar ? "فتح" : "Open"} <ArrowLeft size={16} className="transition-transform ltr:rotate-180 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="rise-3 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle icon={FileCheck2}>{t("docControl")}</CardTitle>
          <div className="grid grid-cols-3 gap-3 p-5">
            <Stat label={ar ? "معتمدة" : "Approved"} value={active.length} href="/dashboard/doc-control?tab=approved" />
            <Stat label={ar ? "موزعة" : "Issued"} value={distributed.length} href="/dashboard/doc-control?tab=distributed" />
            <Stat label={ar ? "ملغاة" : "Cancelled"} value={cancelled.length} href="/dashboard/doc-control?tab=cancelled" />
          </div>
          <div className="border-t border-ink/10 p-5">
            <Progress value={done} max={clauses.length} label={ar ? "إنجاز التقييم الذاتي" : "Self-assessment progress"} />
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/55"><CheckCircle2 size={14} className="text-emerald-600" /> {ar ? "بند منجز = عليه دليل مرفق أو ملاحظة من المقيّم" : "Done = has evidence or assessor notes"}</p>
          </div>
        </Card>

        <Card>
          <CardTitle icon={Share2} action={<Link href="/dashboard/distribution" className="text-sm font-semibold text-brand-700 hover:underline">{ar ? "الكل" : "All"}</Link>}>
            {ar ? "النسخ لدى الأقسام" : "Copies held by department"}
          </CardTitle>
          {holding.length ? (
            <ul className="grid gap-3 p-5">
              {holding.map(({ d, n }) => (
                <li key={d.code}>
                  <Link href={`/dashboard/distribution/${d.code}`} className="group grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
                    <span className="truncate font-semibold text-brand-900 group-hover:underline">{pick(d, "name", lang)}</span>
                    <span className="h-3 bg-brand-100">
                      <span className="block h-full bg-brand-700 transition-colors group-hover:bg-brand-900" style={{ width: `${(n / maxHeld) * 100}%` }} />
                    </span>
                    <span className="text-end font-bold tabular-nums text-brand-900">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-ink/55">{t("empty")}</p>
          )}
        </Card>
      </div>
    </>
  );
}
