import { notFound } from "next/navigation";
import { CalendarClock, FileText, Files, Info, Share2 } from "lucide-react";
import { Badge, Card, CardTitle, PageHeader, PrintHeader } from "@/components/ui";
import { PrintButton } from "@/components/ClientBits";
import { ViewButton } from "@/components/PdfViewer";
import { AdminForm, DeleteButton, Field, FileInput, fieldCls } from "@/components/AdminUI";
import { DocFields } from "@/components/DocFields";
import { getCurrentUser } from "@/lib/auth/session";
import { fileUrl, getCopies, getDepartments, getDocuments, getForms, reviewState } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";
import { deleteDocument, deleteForm, issueCopy, saveDocument, saveForm, withdrawCopy } from "@/app/admin-actions";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [docs, allForms, copies, depts, user] = await Promise.all([getDocuments(), getForms(), getCopies(), getDepartments(), getCurrentUser()]);
  const doc = docs.find((d) => d.id === id);
  if (!doc) notFound();
  const admin = user?.role === "admin";
  const forms = allForms.filter((f) => f.document_id === id);
  const docCopies = copies.filter((c) => c.document_id === id);
  const dept = depts.find((d) => d.code === doc.department);
  const title = pick(doc, "title", lang);
  const rs = reviewState(doc);
  const deptName = (code: string) => pick(depts.find((d) => d.code === code), "name", lang) || code;

  const meta: [string, string | null][] = [
    [ar ? "النوع" : "Type", doc.doc_type === "manual" ? t("manual") : t("sop")],
    [t("department"), dept ? pick(dept, "name", lang) : doc.department],
    [ar ? "الإصدار" : "Version", doc.version],
    [ar ? "تاريخ السريان" : "Effective", doc.effective_at],
  ];
  const control: [string, string | null][] = [
    [ar ? "تاريخ الإصدار" : "Issued", doc.issued_at],
    [ar ? "موعد التحديث القادم" : "Next review", doc.next_review_at],
    [ar ? "تاريخ الاعتماد" : "Approved", doc.approved_at],
    [ar ? "تاريخ الإعداد" : "Prepared", doc.prepared_at],
    [ar ? "تاريخ المراجعة" : "Reviewed", doc.reviewed_at],
    [ar ? "بدء التطبيق" : "Implementation start", doc.implementation_start_at],
  ];

  return (
    <>
      <PrintHeader
        title={ar ? "نظام الجودة — مصنع الصخرة للصناعة — وثيقة معتمدة" : "Quality system — AlSakhra Factory — approved document"}
        sub={(ar ? "صُدّرت من النظام: " : "Exported from the system: ") + new Date().toLocaleString(ar ? "ar-SA" : "en-GB")}
      />
      <PageHeader
        image="/images/lab.jpg"
        back={{ href: "/dashboard/documents", label: t("documents") }}
        eyebrow={<span dir="ltr">{doc.code}</span>}
        title={title}
        actions={<PrintButton label={t("print")} />}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={doc.status === "active" ? "ok" : "neutral"}>{doc.status === "active" ? t("active") : t("obsolete")}</Badge>
          <span className="bg-white/10 px-2 py-0.5 font-semibold text-white/85">{ar ? "الإصدار" : "Version"} <span dir="ltr">{doc.version}</span></span>
          <span className="bg-white/10 px-2 py-0.5 font-semibold text-white/85">{dept ? pick(dept, "name", lang) : doc.department}</span>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle icon={Info}>{ar ? "بيانات الوثيقة" : "Document details"}</CardTitle>
          <div className="p-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {meta.map(([k, v]) => (
              <div key={k}><dt className="text-xs font-semibold text-ink/55">{k}</dt><dd className="mt-1 font-semibold text-brand-900 tabular-nums">{v || "—"}</dd></div>
            ))}
          </dl>
          <div className="mt-6 border-t border-ink/10 pt-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <CalendarClock size={18} className="text-brand-700" />
              <h2 className="font-bold text-brand-900">{ar ? "بيانات ضبط الوثيقة" : "Document control data"}</h2>
              {rs !== "unknown" && (
                <Badge tone={rs === "ok" ? "ok" : rs === "soon" ? "warn" : "bad"}>
                  {rs === "ok" ? (ar ? "ضمن صلاحية المراجعة" : "Within review period") : rs === "soon" ? (ar ? "المراجعة قريبة" : "Review soon") : (ar ? "تجاوزت موعد المراجعة" : "Review overdue")}
                </Badge>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {control.map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold text-ink/55">{k}</dt><dd className="mt-1 font-semibold text-brand-900 tabular-nums"><bdi>{v || "—"}</bdi></dd></div>
              ))}
            </dl>
          </div>
          </div>
        </Card>

        <Card>
          <CardTitle icon={FileText}>{ar ? "الملفات" : "Files"}</CardTitle>
          <ul className="grid gap-3 p-5">
            <li className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
              <span className="text-sm font-semibold">{ar ? "النسخة العربية (الأصل المعتمد)" : "Arabic version (approved original)"}</span>
              <ViewButton url={fileUrl(doc.file_ar)} title={`${doc.code} · AR`} label={ar ? "فتح / طباعة" : "Open / print"} />
            </li>
            <li className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
              <span className="text-sm font-semibold">{ar ? "النسخة الإنجليزية" : "English version"}</span>
              <ViewButton url={fileUrl(doc.file_en)} title={`${doc.code} · EN`} label={ar ? "فتح / طباعة" : "Open / print"} />
            </li>
          </ul>
        </Card>
      </div>

      {/* Forms */}
      <Card className="mt-6">
        <CardTitle icon={Files} count={forms.length}>{t("forms")}</CardTitle>
        <ul className="divide-y divide-ink/10">
          {forms.map((f) => {
            const ft = pick(f, "title", lang);
            return (
              <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
                <span className="min-w-0 flex-1">{ft} <span className="text-xs text-ink/50" dir="ltr">· {f.code}</span></span>
                <ViewButton url={fileUrl(f.file)} title={`${f.code} · ${ft}`} label={t("view")} />
                {admin && <DeleteButton onDelete={deleteForm.bind(null, f.id)} label={t("delete")} confirmText={ar ? "حذف؟" : "Delete?"} />}
              </li>
            );
          })}
          {forms.length === 0 && <li className="px-5 py-4 text-sm text-ink/55">{t("empty")}</li>}
        </ul>
        {admin && (
          <div className="border-t border-ink/10 p-3">
            <AdminForm action={saveForm} summary={ar ? "إضافة نموذج" : "Add a form"} saveLabel={t("save")} savedLabel={t("saved")}>
              <input type="hidden" name="document_id" value={doc.id} />
              <Field label={ar ? "كود النموذج *" : "Form code *"}><input name="code" required placeholder={`F${String(forms.length + 1).padStart(2, "0")}-${doc.department}-${doc.code.slice(-4)}`} className={fieldCls} dir="ltr" /></Field>
              <Field label={ar ? "الاسم بالعربي *" : "Arabic name *"}><input name="title_ar" required className={fieldCls} /></Field>
              <Field label={ar ? "الاسم بالإنجليزي" : "English name"}><input name="title_en" className={fieldCls} dir="ltr" /></Field>
              <FileInput name="file" folder="forms" label={ar ? "الملف (PDF)" : "File (PDF)"} />
            </AdminForm>
          </div>
        )}
      </Card>

      {/* Distributed copies */}
      <Card className="mt-6">
        <CardTitle icon={Share2} count={docCopies.filter((c) => c.status === "distributed").length}>{t("distribution")}</CardTitle>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[560px]">
            <thead>
              <tr>
                <th className="px-5 py-2.5 text-start">{ar ? "رقم النسخة" : "Copy no."}</th>
                <th className="px-5 py-2.5 text-start">{ar ? "القسم المستلم" : "Receiving department"}</th>
                <th className="px-5 py-2.5 text-start">{ar ? "تاريخ الإصدار" : "Issued"}</th>
                <th className="px-5 py-2.5 text-start">{t("status")}</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {docCopies.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-2.5 font-bold tabular-nums">{String(c.copy_number).padStart(2, "0")}</td>
                  <td className="px-5 py-2.5">{deptName(c.department)}</td>
                  <td className="px-5 py-2.5 tabular-nums" dir="ltr">{c.issued_at}</td>
                  <td className="px-5 py-2.5">
                    {c.status === "distributed" ? <Badge tone="brand">{ar ? "موزّعة" : "Issued"}</Badge> : <Badge tone="bad">{ar ? "ملغاة" : "Cancelled"} {c.withdrawn_at}</Badge>}
                  </td>
                  <td className="px-5 py-2.5 text-end">
                    <ViewButton url={`/api/distributed/${c.id}`} title={`${doc.code} · ${String(c.copy_number).padStart(2, "0")} · ${c.department}`} label={t("view")} disabled={!doc.file_ar} />
                  </td>
                </tr>
              ))}
              {docCopies.length === 0 && <tr><td colSpan={5} className="px-5 py-4 text-ink/55">{t("empty")}</td></tr>}
            </tbody>
          </table>
        </div>
        {admin && (
          <div className="grid gap-3 border-t border-ink/10 p-3 lg:grid-cols-2">
            <AdminForm action={issueCopy} summary={ar ? "إصدار نسخ موزعة" : "Issue controlled copies"} saveLabel={ar ? "إصدار" : "Issue"} savedLabel={t("saved")}>
              <input type="hidden" name="document_id" value={doc.id} />
              <fieldset className="grid grid-cols-2 gap-2 sm:col-span-2">
                <legend className="mb-1 text-sm font-semibold text-brand-900">{ar ? "الأقسام المستلمة" : "Receiving departments"}</legend>
                {depts.filter((d) => d.holds_copies).map((d) => (
                  <label key={d.code} className="flex items-center gap-2 text-sm"><input type="checkbox" name="departments" value={d.code} /> {pick(d, "name", lang)}</label>
                ))}
              </fieldset>
              <Field label={ar ? "تاريخ الإصدار" : "Issue date"}><input type="date" name="issued_at" className={fieldCls} /></Field>
            </AdminForm>
            {docCopies.some((c) => c.status === "distributed") && (
              <AdminForm action={withdrawCopy} summary={ar ? "سحب / إلغاء نسخة" : "Withdraw a copy"} saveLabel={ar ? "سحب" : "Withdraw"} savedLabel={t("saved")}>
                <Field label={ar ? "النسخة *" : "Copy *"}>
                  <select name="id" required className={fieldCls}>
                    {docCopies.filter((c) => c.status === "distributed").map((c) => (
                      <option key={c.id} value={c.id}>{String(c.copy_number).padStart(2, "0")} · {deptName(c.department)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={ar ? "تاريخ السحب" : "Withdrawal date"}><input type="date" name="withdrawn_at" className={fieldCls} /></Field>
                <Field label={ar ? "السبب" : "Reason"} wide><input name="reason" className={fieldCls} /></Field>
              </AdminForm>
            )}
          </div>
        )}
      </Card>

      {admin && (
        <div className="mt-6 grid gap-3">
          <AdminForm action={saveDocument} summary={ar ? "تعديل بيانات الوثيقة" : "Edit document details"} saveLabel={t("save")} savedLabel={t("saved")} resetOnSave={false}>
            <DocFields doc={doc} depts={depts} lang={lang} />
          </AdminForm>
          <div><DeleteButton onDelete={deleteDocument.bind(null, doc.id)} label={ar ? "حذف الوثيقة" : "Delete document"} confirmText={ar ? "سيتم حذف الوثيقة ونماذجها ونسخها. متأكد؟" : "This deletes the document, its forms and copies. Sure?"} /></div>
        </div>
      )}
    </>
  );
}
