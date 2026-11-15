import { PageHeader, Chips, PrintHeader } from "@/components/ui";
import { PrintButton, SearchBox } from "@/components/ClientBits";
import { SopIndex } from "@/components/SopIndex";
import { getDepartments, getDocuments, getForms } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";

export default async function SopIndexPage({ searchParams }: { searchParams: Promise<{ dept?: string; q?: string }> }) {
  const { dept = "", q = "" } = await searchParams;
  const lang = await getLang();
  const t = makeT(lang);
  const [docs, forms, depts] = await Promise.all([getDocuments(), getForms(), getDepartments()]);
  const used = depts.filter((d) => docs.some((x) => x.department === d.code));
  return (
    <>
      <PrintHeader title={lang === "ar" ? "الصخرة للصناعة — فهرس إجراءات العمل القياسية" : "Al-Sakhra for Industry — SOP index"} sub={new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB")} />
      <PageHeader
        title={t("sopIndex")}
        subtitle={lang === "ar" ? "كل إجراء ومعه نماذجه، اضغط عرض لفتح الملف مباشرة." : "Every procedure with its forms. Press View to open the file."}
        actions={<PrintButton label={t("print")} />}
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips base="/dashboard/sop-index" current={dept} items={[{ value: "", label: t("all") }, ...used.map((d) => ({ value: d.code, label: `${d.code} · ${pick(d, "name", lang)}` }))]} />
        <SearchBox placeholder={lang === "ar" ? "ابحث باسم الإجراء أو النموذج أو الكود…" : "Search by procedure, form or code…"} />
      </div>
      <SopIndex docs={docs} forms={forms} depts={depts} dept={dept} q={q} lang={lang} t={t} />
    </>
  );
}
