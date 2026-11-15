import { FileText } from "lucide-react";
import { PageHeader, Empty } from "./ui";
import { ViewButton } from "./PdfViewer";
import { AdminForm, DeleteButton, Field, FileInput, fieldCls } from "./AdminUI";
import { getCurrentUser } from "@/lib/auth/session";
import { fileUrl, getPapers, type Paper } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";
import { deletePaper, savePaper } from "@/app/admin-actions";

const TEXT = {
  general: { sub: { ar: "الأوراق والوثائق الرسمية للمصنع (تراخيص، سجلات، أختام)", en: "The factory's official papers (licences, registrations, stamps)" } },
  calibration: { sub: { ar: "شهادات معايرة الأجهزة والموازين", en: "Calibration certificates for instruments and scales" } },
  contracts: { sub: { ar: "عقود الخدمات الخارجية", en: "External service contracts" } },
};

export async function PapersPage({ category, titleKey }: { category: Paper["category"]; titleKey: "general" | "calibration" | "contracts" }) {
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [papers, user] = await Promise.all([getPapers(category), getCurrentUser()]);
  const admin = user?.role === "admin";
  const sub = TEXT[titleKey].sub[lang];

  return (
    <>
      <PageHeader title={t(titleKey)} subtitle={sub} image={titleKey === "calibration" ? "/images/lab.jpg" : titleKey === "contracts" ? "/images/plant.jpg" : "/images/cover.jpg"} />
      {admin && (
        <div className="mb-5">
          <AdminForm action={savePaper} summary={ar ? "إضافة ملف" : "Add a file"} saveLabel={t("save")} savedLabel={t("saved")}>
            <input type="hidden" name="category" value={category} />
            <Field label={ar ? "الاسم بالعربي *" : "Arabic name *"}><input name="title_ar" required className={fieldCls} /></Field>
            <Field label={ar ? "الاسم بالإنجليزي" : "English name"}><input name="title_en" className={fieldCls} dir="ltr" /></Field>
            <FileInput name="file" folder={category} label={ar ? "الملف (PDF)" : "File (PDF)"} />
          </AdminForm>
        </div>
      )}
      {papers.length === 0 ? (
        <Empty>{t("empty")}</Empty>
      ) : (
        <ul className="divide-y divide-ink/10 border border-ink/10 bg-white shadow-sm shadow-brand-950/[0.03]">
          {papers.map((p) => {
            const title = pick(p, "title", lang);
            return (
              <li key={p.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center bg-brand-100 text-brand-700"><FileText size={18} strokeWidth={1.75} /></span>
                  <p className="min-w-0 flex-1 font-semibold text-brand-900">{title}</p>
                  {!p.file && <span className="text-xs text-ink/45">{t("noFile")}</span>}
                  <ViewButton url={fileUrl(p.file)} title={title} label={t("view")} />
                  {admin && <DeleteButton onDelete={deletePaper.bind(null, p.id)} label={t("delete")} confirmText={ar ? "حذف نهائي؟" : "Delete for good?"} />}
                </div>
                {admin && (
                  <div className="mt-2">
                    <AdminForm action={savePaper} summary={t("edit")} saveLabel={t("save")} savedLabel={t("saved")} resetOnSave={false}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="category" value={category} />
                      <Field label={ar ? "الاسم بالعربي *" : "Arabic name *"}><input name="title_ar" required defaultValue={p.title_ar} className={fieldCls} /></Field>
                      <Field label={ar ? "الاسم بالإنجليزي" : "English name"}><input name="title_en" defaultValue={p.title_en ?? ""} className={fieldCls} dir="ltr" /></Field>
                      <Field label={ar ? "الترتيب" : "Order"}><input name="sort" type="number" defaultValue={p.sort} className={fieldCls} /></Field>
                      <FileInput name="file" folder={category} label={ar ? "استبدال الملف" : "Replace file"} current={p.file} />
                    </AdminForm>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
