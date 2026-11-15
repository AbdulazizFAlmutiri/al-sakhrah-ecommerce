import { Building2 } from "lucide-react";
import { PageHeader, Stat, Empty } from "@/components/ui";
import { getCopies, getDepartments } from "@/lib/data";
import { getLang, makeT, pick } from "@/lib/i18n";

export default async function DistributionPage() {
  const lang = await getLang();
  const t = makeT(lang);
  const [copies, depts] = await Promise.all([getCopies(), getDepartments()]);
  const cards = depts.filter((d) => d.holds_copies).map((d) => ({ d, n: copies.filter((c) => c.department === d.code && c.status === "distributed").length }));
  return (
    <>
      <PageHeader title={t("distribution")} image="/images/conveyor.jpg" subtitle={lang === "ar" ? "النسخ الخاضعة للضبط التي يحتفظ بها كل قسم" : "Controlled copies held by each department"} />
      {cards.every((c) => c.n === 0) ? <Empty>{t("empty")}</Empty> : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cards.filter((c) => c.n > 0).map(({ d, n }) => <Stat key={d.code} label={`${d.code} · ${pick(d, "name", lang)}`} value={n} icon={Building2} href={`/dashboard/distribution/${d.code}`} />)}
        </div>
      )}
    </>
  );
}
