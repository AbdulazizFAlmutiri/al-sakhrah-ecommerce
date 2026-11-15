import { Field, FileInput, fieldCls } from "./AdminUI";
import type { Department, Doc } from "@/lib/data";
import { pick, type Lang } from "@/lib/i18n";

export function DocFields({ doc, depts, lang }: { doc?: Doc; depts: Department[]; lang: Lang }) {
  const ar = lang === "ar";
  const date = (name: keyof Doc, label: string) => (
    <Field label={label}><input type="date" name={name} defaultValue={(doc?.[name] as string) ?? ""} className={fieldCls} /></Field>
  );
  return (
    <>
      {doc && <input type="hidden" name="id" value={doc.id} />}
      <Field label={ar ? "الكود *" : "Code *"}><input name="code" required defaultValue={doc?.code} placeholder="SOP-QC-0001" className={fieldCls} dir="ltr" /></Field>
      <Field label={ar ? "القسم *" : "Department *"}>
        <select name="department" required defaultValue={doc?.department ?? ""} className={fieldCls}>
          <option value="" disabled>—</option>
          {depts.map((d) => <option key={d.code} value={d.code}>{d.code} · {pick(d, "name", lang)}</option>)}
        </select>
      </Field>
      <Field label={ar ? "العنوان بالعربي *" : "Arabic title *"} wide><input name="title_ar" required defaultValue={doc?.title_ar} className={fieldCls} /></Field>
      <Field label={ar ? "العنوان بالإنجليزي" : "English title"} wide><input name="title_en" defaultValue={doc?.title_en ?? ""} className={fieldCls} dir="ltr" /></Field>
      <Field label={ar ? "النوع" : "Type"}>
        <select name="doc_type" defaultValue={doc?.doc_type ?? "sop"} className={fieldCls}>
          <option value="sop">{ar ? "إجراء عمل قياسي" : "SOP"}</option>
          <option value="manual">{ar ? "دليل الجودة" : "Quality manual"}</option>
        </select>
      </Field>
      <Field label={ar ? "الحالة" : "Status"}>
        <select name="status" defaultValue={doc?.status ?? "active"} className={fieldCls}>
          <option value="active">{ar ? "مفعّل" : "Active"}</option>
          <option value="obsolete">{ar ? "ملغى" : "Obsolete"}</option>
        </select>
      </Field>
      <Field label={ar ? "الإصدار" : "Version"}><input name="version" defaultValue={doc?.version ?? "1.0"} className={fieldCls} dir="ltr" /></Field>
      <Field label={ar ? "الترتيب" : "Order"}><input name="sort" type="number" defaultValue={doc?.sort ?? 100} className={fieldCls} /></Field>
      {date("prepared_at", ar ? "تاريخ الإعداد" : "Prepared")}
      {date("reviewed_at", ar ? "تاريخ المراجعة" : "Reviewed")}
      {date("approved_at", ar ? "تاريخ الاعتماد" : "Approved")}
      {date("issued_at", ar ? "تاريخ الإصدار" : "Issued")}
      {date("effective_at", ar ? "تاريخ السريان" : "Effective")}
      {date("implementation_start_at", ar ? "بدء التطبيق" : "Implementation start")}
      <FileInput name="file_ar" folder="documents" label={ar ? "النسخة العربية المعتمدة (PDF)" : "Approved Arabic version (PDF)"} current={doc?.file_ar} />
      <FileInput name="file_en" folder="documents" label={ar ? "النسخة الإنجليزية (PDF)" : "English version (PDF)"} current={doc?.file_en} />
    </>
  );
}
