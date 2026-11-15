import Link from "next/link";
import { ViewButton } from "./PdfViewer";
import { Empty } from "./ui";
import { fileUrl, matches, type Department, type Doc, type Form } from "@/lib/data";
import { pick, type Lang } from "@/lib/i18n";

/** Departments → numbered SOPs → their forms. Used by the procedures index and document control. */
export function SopIndex({ docs, forms, depts, dept, q, lang, t }: {
  docs: Doc[]; forms: Form[]; depts: Department[]; dept: string; q: string; lang: Lang;
  t: (k: "view" | "issueWithdrawForm" | "empty" | "manual" | "forms") => string;
}) {
  const formsByDoc = new Map<string, Form[]>();
  forms.forEach((f) => formsByDoc.set(f.document_id, [...(formsByDoc.get(f.document_id) ?? []), f]));

  const visible = docs.filter((d) => d.status === "active" && (!dept || d.department === dept));
  const hit = (d: Doc) => matches(q, d.code, d.title_ar, d.title_en) || (formsByDoc.get(d.id) ?? []).some((f) => matches(q, f.code, f.title_ar, f.title_en));
  const groups = depts
    .map((dep) => ({ dep, docs: visible.filter((d) => d.department === dep.code && hit(d)) }))
    .filter((g) => g.docs.length);

  if (!groups.length) return <Empty>{t("empty")}</Empty>;
  return (
    <div className="grid gap-6">
      {groups.map(({ dep, docs }) => (
        <section key={dep.code} className="break-inside-avoid border border-ink/10 bg-white">
          <header className="flex items-center gap-3 border-b border-ink/10 bg-brand-950 px-4 py-3 text-white">
            <span className="bg-white/15 px-2 py-0.5 text-xs font-bold" dir="ltr">{dep.code}</span>
            <h2 className="flex-1 font-bold">{pick(dep, "name", lang)}</h2>
            <span className="text-sm text-white/70 tabular-nums">{docs.length}</span>
          </header>
          <ol className="divide-y divide-ink/10">
            {docs.map((d, i) => {
              const fs = (formsByDoc.get(d.id) ?? []).filter((f) => !q || matches(q, f.code, f.title_ar, f.title_en) || matches(q, d.code, d.title_ar, d.title_en));
              const title = pick(d, "title", lang);
              return (
                <li key={d.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="w-6 text-sm font-bold tabular-nums text-brand-700">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/documents/${d.id}`} className="font-semibold text-brand-900 hover:underline">{title}</Link>
                      <p className="text-xs text-ink/55" dir="ltr">{d.code}{d.doc_type === "manual" ? ` · ${t("manual")}` : ""}</p>
                    </div>
                    <ViewButton url={fileUrl(d.file_ar)} title={`${d.code} · ${title}`} label={t("view")} />
                  </div>
                  {fs.length > 0 && (
                    <ul className="mt-2 grid gap-1.5 border-s-2 border-brand-100 ps-4 ms-8">
                      {fs.map((f) => {
                        const ft = pick(f, "title", lang);
                        return (
                          <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="min-w-0 flex-1">{ft} <span className="text-xs text-ink/50" dir="ltr">· {f.code}</span></span>
                            <ViewButton url={fileUrl(f.file)} title={`${f.code} · ${ft}`} label={t("view")} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
