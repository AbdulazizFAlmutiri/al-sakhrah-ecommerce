import Link from "next/link";
import { PageHeader, Chips, Badge, Empty, PrintHeader } from "@/components/ui";
import { PrintButton, SearchBox } from "@/components/ClientBits";
import { SopIndex } from "@/components/SopIndex";
import { getCopies, getDepartments, getDocuments, getForms, matches } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";

const TABS = ["approved", "distributed", "cancelled"] as const;

export default async function DocControlPage({ searchParams }: { searchParams: Promise<{ tab?: string; dept?: string; q?: string }> }) {
  const sp = await searchParams;
  const tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as (typeof TABS)[number]) : "approved";
  const dept = sp.dept ?? "";
  const q = sp.q ?? "";
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const [docs, forms, copies, depts] = await Promise.all([getDocuments(), getForms(), getCopies(), getDepartments()]);
  const active = docs.filter((d) => d.status === "active");
  const deptName = (code: string) => pick(depts.find((d) => d.code === code), "name", lang) || code;
  const count = { approved: active.length, distributed: copies.filter((c) => c.status === "distributed").length, cancelled: copies.filter((c) => c.status === "cancelled").length };
  const label = { approved: ar ? "النسخ المعتمدة" : "Approved versions", distributed: ar ? "سجل الإصدار والسحب" : "Issue & withdrawal record", cancelled: ar ? "النسخ الملغاة" : "Cancelled copies" };
  const used = depts.filter((d) => docs.some((x) => x.department === d.code));
  const base = `/dashboard/doc-control?tab=${tab}`;
  const shown = active.filter((d) => (!dept || d.department === dept) && matches(q, d.code, d.title_ar, d.title_en));

  return (
    <>
      <PrintHeader title={`${ar ? "الصخرة للصناعة — ضبط الوثائق" : "Al-Sakhra — document control"} · ${label[tab]}`} sub={new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB")} />
      <PageHeader title={t("docControl")} image="/images/production.jpg" subtitle={ar ? "متابعة إصدار الوثائق المعتمدة ونسخها الموزّعة والملغاة." : "Track approved documents and their issued and cancelled copies."} actions={<PrintButton label={t("print")} />} />
      <nav className="no-print mb-6 grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-3">
        {TABS.map((k) => (
          <Link key={k} href={`/dashboard/doc-control?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`flex items-center justify-between gap-3 px-5 py-4 text-sm font-semibold transition-colors ${tab === k ? "bg-brand-900 text-white" : "bg-white text-brand-900 hover:bg-brand-100"}`}>
            <span>{label[k]}</span> <span className={`text-2xl font-bold tabular-nums ${tab === k ? "text-white" : "text-brand-700"}`}>{count[k]}</span>
          </Link>
        ))}
      </nav>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips base={base} current={dept} items={[{ value: "", label: t("all") }, ...used.map((d) => ({ value: d.code, label: d.code }))]} />
        <SearchBox placeholder={ar ? "ابحث بالكود أو الاسم…" : "Search by code or title…"} />
      </div>

      {tab === "approved" && <SopIndex docs={docs} forms={forms} depts={depts} dept={dept} q={q} lang={lang} t={t} />}

      {tab === "distributed" && (
        shown.length === 0 ? <Empty>{t("empty")}</Empty> : (
          <div className="grid gap-4">
            {shown.map((d) => {
              const cs = copies.filter((c) => c.document_id === d.id && c.status === "distributed");
              if (!cs.length) return null;
              return (
                <section key={d.id} className="break-inside-avoid border border-ink/10 bg-white">
                  <header className="flex flex-wrap items-center gap-2 border-b border-ink/10 px-4 py-3">
                    <Link href={`/dashboard/documents/${d.id}`} className="min-w-0 flex-1 font-semibold text-brand-900 hover:underline">{pick(d, "title", lang)} <span className="text-xs text-ink/50" dir="ltr">{d.code}</span></Link>
                    <Badge tone="brand">{ar ? `موزّعة على (${cs.length})` : `Issued to ${cs.length}`}</Badge>
                  </header>
                  <div className="grid grid-cols-2 gap-px bg-ink/10 sm:grid-cols-3 lg:grid-cols-5">
                    {cs.map((c) => (
                      <div key={c.id} className="bg-white px-4 py-2 text-sm">
                        <span className="font-bold tabular-nums text-brand-700">{String(c.copy_number).padStart(2, "0")}</span> · {deptName(c.department)}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )
      )}

      {tab === "cancelled" && (() => {
        const rows = copies.filter((c) => c.status === "cancelled").map((c) => ({ c, d: docs.find((x) => x.id === c.document_id) })).filter(({ d }) => d && (!dept || d.department === dept) && matches(q, d.code, d.title_ar, d.title_en));
        return rows.length === 0 ? <Empty>{t("empty")}</Empty> : (
          <div className="overflow-x-auto border border-ink/10 bg-white shadow-sm shadow-brand-950/[0.03]">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-start">{t("title")}</th>
                  <th className="px-4 py-2.5 text-start">{ar ? "النسخة" : "Copy"}</th>
                  <th className="px-4 py-2.5 text-start">{t("department")}</th>
                  <th className="px-4 py-2.5 text-start">{ar ? "تاريخ السحب" : "Withdrawn"}</th>
                  <th className="px-4 py-2.5 text-start">{ar ? "السبب" : "Reason"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {rows.map(({ c, d }) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5"><Link href={`/dashboard/documents/${d!.id}`} className="font-semibold text-brand-900 hover:underline">{pick(d!, "title", lang)}</Link> <span className="text-xs text-ink/50" dir="ltr">{d!.code}</span></td>
                    <td className="px-4 py-2.5 font-bold tabular-nums">{String(c.copy_number).padStart(2, "0")}</td>
                    <td className="px-4 py-2.5">{deptName(c.department)}</td>
                    <td className="px-4 py-2.5 tabular-nums" dir="ltr">{c.withdrawn_at}</td>
                    <td className="px-4 py-2.5">{c.withdraw_reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </>
  );
}
