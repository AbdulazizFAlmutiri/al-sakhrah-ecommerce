import Link from "next/link";
import { PageHeader, Chips, Badge, Empty } from "@/components/ui";
import { SearchBox } from "@/components/ClientBits";
import { ViewButton } from "@/components/PdfViewer";
import { AdminForm } from "@/components/AdminUI";
import { DocFields } from "@/components/DocFields";
import { getCurrentUser } from "@/lib/auth/session";
import { fileUrl, getDepartments, getDocuments, getForms, matches } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";
import { saveDocument } from "@/app/admin-actions";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ dept?: string; q?: string }> }) {
  const { dept = "", q = "" } = await searchParams;
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [docs, forms, depts, user] = await Promise.all([getDocuments(), getForms(), getDepartments(), getCurrentUser()]);
  const list = docs.filter((d) => (!dept || d.department === dept) && matches(q, d.code, d.title_ar, d.title_en));
  const used = depts.filter((d) => docs.some((x) => x.department === d.code));

  return (
    <>
      <PageHeader title={t("documents")} subtitle={ar ? `${docs.length} وثيقة` : `${docs.length} documents`} />
      {user?.role === "admin" && (
        <div className="mb-5">
          <AdminForm action={saveDocument} summary={ar ? "إضافة إجراء جديد" : "Add a new SOP"} saveLabel={t("save")} savedLabel={t("saved")}>
            <DocFields depts={depts} lang={lang} />
          </AdminForm>
        </div>
      )}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips base="/dashboard/documents" current={dept} items={[{ value: "", label: t("all") }, ...used.map((d) => ({ value: d.code, label: d.code }))]} />
        <SearchBox placeholder={ar ? "ابحث بكود الوثيقة أو العنوان… (مثال: SOP-QC)" : "Search code or title… (e.g. SOP-QC)"} />
      </div>
      {list.length === 0 ? (
        <Empty>{t("empty")}</Empty>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-start text-xs font-semibold uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-3 text-start">{t("title")}</th>
                <th className="px-4 py-3 text-start">{t("code")}</th>
                <th className="px-4 py-3 text-start">{t("forms")}</th>
                <th className="px-4 py-3 text-start">{t("status")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {list.map((d) => {
                const title = pick(d, "title", lang);
                return (
                  <tr key={d.id} className="hover:bg-brand-100/30">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/documents/${d.id}`} className="font-semibold text-brand-900 hover:underline">{title}</Link>
                      <p className="text-xs text-ink/50">{d.doc_type === "manual" ? t("manual") : t("sop")}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums" dir="ltr">{d.code}</td>
                    <td className="px-4 py-3 tabular-nums">{forms.filter((f) => f.document_id === d.id).length}</td>
                    <td className="px-4 py-3"><Badge tone={d.status === "active" ? "ok" : "neutral"}>{d.status === "active" ? t("active") : t("obsolete")}</Badge></td>
                    <td className="px-4 py-3 text-end"><ViewButton url={fileUrl(d.file_ar)} title={`${d.code} · ${title}`} label={t("view")} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
