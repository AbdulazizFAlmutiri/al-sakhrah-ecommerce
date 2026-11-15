import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ClipboardList, Paperclip, Search } from "lucide-react";
import { Badge, Card, CardTitle, PageHeader } from "@/components/ui";
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
      <PageHeader
        image="/images/plant.jpg"
        back={{ href: "/dashboard/clauses", label: t("clauses") }}
        eyebrow={`${ar ? "البند" : "Clause"} ${c.number} / ${clauses.length}`}
        title={<span className="text-2xl leading-relaxed md:text-3xl">{pick(c, "text", lang)}</span>}
        actions={<div className="flex gap-2">
          {prev && <Link href={`/dashboard/clauses/${prev.number}`} className="inline-flex items-center gap-1 bg-white px-3 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-100">{ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {prev.number}</Link>}
          {next && <Link href={`/dashboard/clauses/${next.number}`} className="inline-flex items-center gap-1 bg-white px-3 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-100">{next.number} {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</Link>}
        </div>}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={c.severity === "major" ? "bad" : "neutral"}>{c.severity === "major" ? (ar ? "ملاحظة مؤثرة" : "Major") : (ar ? "ملاحظة ثانوية" : "Minor")}</Badge>
          {c.reference && <span className="bg-white/10 px-2 py-0.5 font-semibold text-white/85">{ar ? "مرجع" : "Ref."} <span dir="ltr">{c.reference}</span></span>}
        </div>
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle icon={ClipboardList}>{ar ? "ملاحظات المقيّم" : "Assessor notes"}</CardTitle>
          <div className="p-5"><NoteEditor initial={c.assessor_notes ?? ""} readOnly={!canAssess} onSave={saveClauseNote.bind(null, c.number, "assessor_notes")} labels={noteLabels} /></div>
        </Card>
        <Card>
          <CardTitle icon={Search}>{ar ? "ملاحظات التفتيش" : "Inspection notes"}</CardTitle>
          <div className="p-5"><NoteEditor initial={c.inspection_notes ?? ""} readOnly={!canInspect} onSave={saveClauseNote.bind(null, c.number, "inspection_notes")} labels={noteLabels} /></div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle icon={Paperclip} count={items.length}>{ar ? "مرفقات وأدلة" : "Attachments & evidence"}</CardTitle>
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
