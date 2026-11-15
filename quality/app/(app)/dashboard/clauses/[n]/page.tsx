import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { ViewButton } from "@/components/PdfViewer";
import { AdminForm, DeleteButton, Field, FileInput, NoteEditor, fieldCls } from "@/components/AdminUI";
import { getCurrentUser } from "@/lib/auth/session";
import { fileUrl, getClauses, getDocuments, getEvidence, getForms, getPapers } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";
import { addEvidence, removeEvidence, saveClauseNote } from "@/app/admin-actions";

export default async function ClausePage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [clauses, evidence, docs, forms, gen, cal, con, user] = await Promise.all([
    getClauses(), getEvidence(), getDocuments(), getForms(), getPapers("general"), getPapers("calibration"), getPapers("contract"), getCurrentUser(),
  ]);
  const i = clauses.findIndex((c) => c.number === n);
  if (i < 0) notFound();
  const c = clauses[i];
  const prev = clauses[i - 1];
  const next = clauses[i + 1];
  const admin = user?.role === "admin";
  const papers = [...gen, ...cal, ...con];
  const items = evidence.filter((e) => e.clause_number === n).map((e) => {
    const d = e.document_id ? docs.find((x) => x.id === e.document_id) : null;
    const f = e.form_id ? forms.find((x) => x.id === e.form_id) : null;
    const p = e.paper_id ? papers.find((x) => x.id === e.paper_id) : null;
    const title = e.label || (d ? `${d.code} · ${pick(d, "title", lang)}` : f ? `${f.code} · ${pick(f, "title", lang)}` : p ? pick(p, "title", lang) : ar ? "مرفق" : "Attachment");
    const url = fileUrl(d?.file_ar ?? f?.file ?? p?.file ?? e.file);
    return { e, title, url, href: d ? `/dashboard/documents/${d.id}` : f ? `/dashboard/documents/${f.document_id}` : null };
  });
  const canAssess = user?.role === "admin" || user?.role === "manager";
  const canInspect = user?.role === "admin" || user?.role === "inspector";
  const noteLabels = { hint: ar ? "Enter للحفظ، Shift+Enter لسطر جديد" : "Enter saves, Shift+Enter adds a line", saved: t("saved"), placeholder: ar ? "اكتب ملاحظتك…" : "Write a note…" };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/clauses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowRight size={16} className="ltr:rotate-180" /> {t("clauses")}
        </Link>
        <div className="flex gap-2">
          {prev && <Link href={`/dashboard/clauses/${prev.number}`} className="inline-flex items-center gap-1 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 ring-1 ring-ink/10 hover:bg-brand-100">{ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {prev.number}</Link>}
          {next && <Link href={`/dashboard/clauses/${next.number}`} className="inline-flex items-center gap-1 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 ring-1 ring-ink/10 hover:bg-brand-100">{next.number} {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</Link>}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-3xl font-bold tabular-nums text-brand-700">{c.number}</span>
          <Badge tone={c.severity === "major" ? "bad" : "neutral"}>{c.severity === "major" ? (ar ? "ملاحظة مؤثرة" : "Major") : (ar ? "ملاحظة ثانوية" : "Minor")}</Badge>
          {c.reference && <span className="text-sm text-ink/55">{ar ? "مرجع" : "Ref."} <span dir="ltr">{c.reference}</span></span>}
        </div>
        <p className="mt-3 text-lg leading-loose">{pick(c, "text", lang)}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-brand-900">{ar ? "ملاحظات المقيّم" : "Assessor notes"}</h2>
          <NoteEditor initial={c.assessor_notes ?? ""} readOnly={!canAssess} onSave={saveClauseNote.bind(null, c.number, "assessor_notes")} labels={noteLabels} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-brand-900">{ar ? "ملاحظات التفتيش" : "Inspection notes"}</h2>
          <NoteEditor initial={c.inspection_notes ?? ""} readOnly={!canInspect} onSave={saveClauseNote.bind(null, c.number, "inspection_notes")} labels={noteLabels} />
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="border-b border-ink/10 px-5 py-3 font-bold text-brand-900">{ar ? "مرفقات وأدلة" : "Attachments & evidence"} ({items.length})</h2>
        <ul className="divide-y divide-ink/10">
          {items.map(({ e, title, url, href }) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
              {href ? <Link href={href} className="min-w-0 flex-1 font-semibold text-brand-900 hover:underline">{title}</Link> : <span className="min-w-0 flex-1 font-semibold">{title}</span>}
              <ViewButton url={url} title={title} label={t("view")} />
              {admin && <DeleteButton onDelete={removeEvidence.bind(null, e.id)} label={t("delete")} confirmText={ar ? "إزالة؟" : "Remove?"} />}
            </li>
          ))}
          {items.length === 0 && <li className="px-5 py-4 text-sm text-ink/55">{t("empty")}</li>}
        </ul>
        {admin && (
          <div className="border-t border-ink/10 p-3">
            <AdminForm action={addEvidence} summary={ar ? "ربط دليل" : "Link evidence"} saveLabel={t("add")} savedLabel={t("saved")}>
              <input type="hidden" name="clause_number" value={c.number} />
              <Field label={ar ? "اختر إجراء أو نموذج أو ملف" : "Pick an SOP, form or file"} wide>
                <select name="target" defaultValue="" className={fieldCls}>
                  <option value="">{ar ? "— أو ارفع ملفًا أدناه —" : "— or upload a file below —"}</option>
                  <optgroup label={t("documents")}>{docs.map((d) => <option key={d.id} value={`document:${d.id}`}>{d.code} · {pick(d, "title", lang)}</option>)}</optgroup>
                  <optgroup label={t("forms")}>{forms.map((f) => <option key={f.id} value={`form:${f.id}`}>{f.code} · {pick(f, "title", lang)}</option>)}</optgroup>
                  <optgroup label={`${t("general")} / ${t("calibration")} / ${t("contracts")}`}>{papers.map((p) => <option key={p.id} value={`paper:${p.id}`}>{pick(p, "title", lang)}</option>)}</optgroup>
                </select>
              </Field>
              <FileInput name="file" folder="evidence" label={ar ? "أو ارفع ملفًا" : "Or upload a file"} />
              <Field label={ar ? "وصف (اختياري)" : "Label (optional)"}><input name="label" className={fieldCls} /></Field>
            </AdminForm>
          </div>
        )}
      </Card>
    </>
  );
}
