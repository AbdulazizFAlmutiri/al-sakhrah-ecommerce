import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageHeader, Stat, Card, Badge } from "@/components/ui";
import { getClauses, getCopies, getDepartments, getDocuments, getEvidence, getForms, reviewState } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";

export default async function Home() {
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [docs, forms, clauses, evidence, copies, depts] = await Promise.all([getDocuments(), getForms(), getClauses(), getEvidence(), getCopies(), getDepartments()]);

  const active = docs.filter((d) => d.status === "active");
  const sops = active.filter((d) => d.doc_type === "sop");
  const manual = active.find((d) => d.doc_type === "manual");
  const withEvidence = new Set(evidence.map((e) => e.clause_number));
  const done = clauses.filter((c) => withEvidence.has(c.number) || (c.assessor_notes ?? "").trim()).length;
  const distributed = copies.filter((c) => c.status === "distributed");
  const cancelled = copies.filter((c) => c.status === "cancelled");
  const due = active.filter((d) => reviewState(d) !== "ok" && reviewState(d) !== "unknown").sort((a, b) => (a.next_review_at ?? "").localeCompare(b.next_review_at ?? ""));
  const holding = depts.filter((d) => d.holds_copies).map((d) => ({ d, n: distributed.filter((c) => c.department === d.code).length })).filter((x) => x.n > 0);

  return (
    <>
      <PageHeader title={t("home")} subtitle={ar ? "نظرة عامة على نظام الجودة بمصنع الصخرة للصناعة" : "Overview of the quality system at AlSakhra Factory"} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("documents")} value={sops.length} href="/dashboard/documents" />
        <Stat label={t("manual")} value={manual ? 1 : 0} href={manual ? `/dashboard/documents/${manual.id}` : "/dashboard/documents"} />
        <Stat label={ar ? "النماذج والسجلات" : "Forms & records"} value={forms.length} href="/dashboard/sop-index" />
        <Stat label={t("clauses")} value={`${done} / ${clauses.length}`} href="/dashboard/clauses" hint={ar ? "بنود عليها أدلة أو ملاحظات" : "clauses with evidence or notes"} />
      </div>

      {due.length > 0 && (
        <Card className="mt-6 border-amber-300 bg-amber-50/60">
          <div className="flex items-center gap-2 border-b border-amber-200 px-5 py-3 font-bold text-amber-900">
            <AlertTriangle size={18} /> {ar ? `مراجعات مستحقة (${due.length})` : `Reviews due (${due.length})`}
          </div>
          <ul className="divide-y divide-amber-200/70">
            {due.slice(0, 8).map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
                <Link href={`/dashboard/documents/${d.id}`} className="min-w-0 flex-1 font-semibold text-brand-900 hover:underline">{pick(d, "title", lang)} <span className="text-xs text-ink/50" dir="ltr">{d.code}</span></Link>
                <Badge tone={reviewState(d) === "due" ? "bad" : "warn"}>{reviewState(d) === "due" ? (ar ? "متأخرة" : "Overdue") : (ar ? "قريبًا" : "Soon")}</Badge>
                <span className="text-ink/60 tabular-nums" dir="ltr">{d.next_review_at}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-bold text-brand-900">{t("docControl")}</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label={ar ? "النسخ المعتمدة" : "Approved"} value={active.length} href="/dashboard/doc-control?tab=approved" />
            <Stat label={ar ? "سجل الإصدار والسحب" : "Issued copies"} value={distributed.length} href="/dashboard/doc-control?tab=distributed" />
            <Stat label={ar ? "النسخ الملغاة" : "Cancelled"} value={cancelled.length} href="/dashboard/doc-control?tab=cancelled" />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-bold text-brand-900">{t("distribution")}</h2>
          {holding.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {holding.map(({ d, n }) => <Stat key={d.code} label={pick(d, "name", lang)} value={n} href={`/dashboard/distribution/${d.code}`} />)}
            </div>
          ) : (
            <p className="text-sm text-ink/55">{t("empty")}</p>
          )}
        </Card>
      </div>
    </>
  );
}
