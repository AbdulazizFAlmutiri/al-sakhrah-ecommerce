import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader, Empty, PrintHeader } from "@/components/ui";
import { PrintButton } from "@/components/ClientBits";
import { ViewButton } from "@/components/PdfViewer";
import { getCopies, getDepartments, getDocuments, getForms } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";

export default async function DeptCopiesPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [copies, depts, docs, forms] = await Promise.all([getCopies(), getDepartments(), getDocuments(), getForms()]);
  const holder = depts.find((d) => d.code === dept);
  if (!holder) notFound();
  const held = copies.filter((c) => c.department === dept && c.status === "distributed").map((c) => ({ c, d: docs.find((x) => x.id === c.document_id)! })).filter((x) => x.d);
  const groups = depts.map((owner) => ({ owner, items: held.filter((x) => x.d.department === owner.code) })).filter((g) => g.items.length);

  return (
    <>
      <PrintHeader title={`${ar ? "النسخ الموزعة لدى" : "Controlled copies held by"} ${pick(holder, "name", lang)}`} sub={new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB")} />
      <Link href="/dashboard/distribution" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowRight size={16} className="ltr:rotate-180" /> {t("distribution")}
      </Link>
      <PageHeader image="/images/conveyor.jpg" back={{ href: "/dashboard/distribution", label: t("distribution") }} title={`${pick(holder, "name", lang)} (${held.length})`} subtitle={ar ? "النسخ التي يحتفظ بها القسم، مجمّعة حسب القسم المالك للإجراء" : "Copies this department holds, grouped by the owning department"} actions={<PrintButton label={t("print")} />} />
      {groups.length === 0 ? <Empty>{t("empty")}</Empty> : (
        <div className="grid gap-5">
          {groups.map(({ owner, items }) => (
            <section key={owner.code} className="break-inside-avoid border border-ink/10 bg-white">
              <header className="flex items-center gap-3 border-b border-ink/10 bg-surface px-4 py-2.5">
                <span className="font-bold text-brand-900">{owner.code} · {pick(owner, "name", lang)}</span>
                <span className="text-sm text-ink/55 tabular-nums">{items.length}</span>
              </header>
              <ul className="divide-y divide-ink/10">
                {items.map(({ c, d }) => {
                  const title = pick(d, "title", lang);
                  const no = String(c.copy_number).padStart(2, "0");
                  return (
                    <li key={c.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-brand-100 px-2 py-0.5 text-xs font-bold tabular-nums text-brand-900">{no}</span>
                        <span className="min-w-0 flex-1 font-semibold">{title} <span className="text-xs font-normal text-ink/50" dir="ltr">{d.code}</span></span>
                        <ViewButton url={`/api/distributed/${c.id}`} title={`${d.code} · ${no} · ${dept}`} label={t("view")} disabled={!d.file_ar} />
                      </div>
                      {forms.filter((f) => f.document_id === d.id).map((f) => (
                        <div key={f.id} className="mt-1.5 flex flex-wrap items-center gap-3 ps-10 text-sm">
                          <span className="min-w-0 flex-1">{pick(f, "title", lang)} <span className="text-xs text-ink/50" dir="ltr">{f.code}</span></span>
                          <ViewButton url={`/api/distributed/${c.id}?form=${f.id}`} title={`${f.code} · ${no} · ${dept}`} label={t("view")} disabled={!f.file} />
                        </div>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
