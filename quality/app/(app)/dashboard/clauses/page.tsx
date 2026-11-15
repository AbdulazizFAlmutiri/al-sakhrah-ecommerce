import Link from "next/link";
import { PageHeader, Chips, Badge, Empty, PrintHeader } from "@/components/ui";
import { PrintButton, SearchBox } from "@/components/ClientBits";
import { AdminForm, Field, fieldCls } from "@/components/AdminUI";
import { getCurrentUser } from "@/lib/auth/session";
import { getClauses, getEvidence, matches } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";
import { saveClause } from "@/app/admin-actions";

export default async function ClausesPage({ searchParams }: { searchParams: Promise<{ sev?: string; q?: string }> }) {
  const { sev = "", q = "" } = await searchParams;
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [clauses, evidence, user] = await Promise.all([getClauses(), getEvidence(), getCurrentUser()]);
  const ev = new Map<number, number>();
  evidence.forEach((e) => ev.set(e.clause_number, (ev.get(e.clause_number) ?? 0) + 1));
  const isDone = (n: number, notes: string | null) => (ev.get(n) ?? 0) > 0 || Boolean(notes?.trim());
  const done = clauses.filter((c) => isDone(c.number, c.assessor_notes)).length;
  const pct = clauses.length ? Math.round((done / clauses.length) * 100) : 0;
  const list = clauses.filter((c) => (!sev || c.severity === sev) && matches(q, String(c.number), c.text_ar, c.text_en, c.reference));
  const sevLabel = (s: string) => (s === "major" ? (ar ? "ملاحظة مؤثرة" : "Major") : (ar ? "ملاحظة ثانوية" : "Minor"));

  return (
    <>
      <PrintHeader title={ar ? "الصخرة للصناعة — التقييم الذاتي" : "Al-Sakhra — self-assessment"} sub={`${done} / ${clauses.length} · ${new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB")}`} />
      <PageHeader
        title={`${t("clauses")} (${clauses.length})`}
        subtitle={ar ? "متطلبات الهيئة، وكل بند مربوط بالإجراءات التي تثبت الالتزام به." : "Regulator requirements, each linked to the procedures that show compliance."}
        actions={<PrintButton label={t("print")} />}
      />
      <div className="mb-5 border border-ink/10 bg-white p-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-brand-900">{ar ? "نسبة الإنجاز" : "Progress"}</span>
          <span className="tabular-nums text-ink/70">{done} / {clauses.length} · {pct}%</span>
        </div>
        <div className="mt-2 h-2.5 bg-surface" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {user?.role === "admin" && (
        <div className="mb-5">
          <AdminForm action={saveClause} summary={ar ? "إضافة بند / تعديل بند بالرقم" : "Add a clause (or edit by number)"} saveLabel={t("save")} savedLabel={t("saved")}>
            <Field label={ar ? "رقم البند *" : "Number *"}><input name="number" type="number" min={1} required defaultValue={clauses.length + 1} className={fieldCls} /></Field>
            <Field label={ar ? "المرجع" : "Reference"}><input name="reference" placeholder="1/2/4" className={fieldCls} dir="ltr" /></Field>
            <Field label={ar ? "نص المتطلب بالعربي *" : "Requirement (Arabic) *"} wide><textarea name="text_ar" required rows={3} className={fieldCls} /></Field>
            <Field label={ar ? "نص المتطلب بالإنجليزي" : "Requirement (English)"} wide><textarea name="text_en" rows={2} className={fieldCls} dir="ltr" /></Field>
            <Field label={ar ? "التصنيف" : "Severity"}>
              <select name="severity" className={fieldCls}><option value="minor">{sevLabel("minor")}</option><option value="major">{sevLabel("major")}</option></select>
            </Field>
          </AdminForm>
        </div>
      )}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips base="/dashboard/clauses" param="sev" current={sev} items={[{ value: "", label: t("all") }, { value: "major", label: sevLabel("major") }, { value: "minor", label: sevLabel("minor") }]} />
        <SearchBox placeholder={ar ? "ابحث برقم البند أو نصه…" : "Search by number or text…"} />
      </div>
      {list.length === 0 ? <Empty>{t("empty")}</Empty> : (
        <ul className="divide-y divide-ink/10 border border-ink/10 bg-white">
          {list.map((c) => (
            <li key={c.number}>
              <Link href={`/dashboard/clauses/${c.number}`} className="flex gap-4 px-4 py-3 hover:bg-brand-100/30">
                <span className="w-8 shrink-0 text-lg font-bold tabular-nums text-brand-700">{c.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-relaxed">{pick(c, "text", lang)}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    {c.reference && <span className="text-xs text-ink/50">{ar ? "مرجع" : "Ref."} <span dir="ltr">{c.reference}</span></span>}
                    <Badge tone={c.severity === "major" ? "bad" : "neutral"}>{sevLabel(c.severity)}</Badge>
                    {isDone(c.number, c.assessor_notes) ? <Badge tone="ok">✓ {ev.get(c.number) ?? 0} {ar ? "دليل" : "evidence"}</Badge> : <Badge tone="warn">{ar ? "بدون أدلة" : "No evidence"}</Badge>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
