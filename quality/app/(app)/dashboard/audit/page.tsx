import { PageHeader, Empty } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getLang, makeT } from "@/lib/i18n";

export default async function AuditPage() {
  await requireAdmin();
  const lang = await getLang();
  const t = makeT(lang);
  const s = await createClient();
  const [{ data: rows }, { data: people }] = await Promise.all([
    s.from("audit_log").select("*").order("at", { ascending: false }).limit(300),
    s.from("profiles").select("user_id, full_name"),
  ]);
  const name = new Map((people ?? []).map((p) => [p.user_id, p.full_name]));
  return (
    <>
      <PageHeader title={t("audit")} image="/images/automation.jpg" subtitle={lang === "ar" ? "آخر 300 تغيير: من غيّر ماذا ومتى" : "The last 300 changes: who changed what, and when"} />
      {!rows?.length ? <Empty>{t("empty")}</Empty> : (
        <div className="overflow-x-auto border border-ink/10 bg-white shadow-sm shadow-brand-950/[0.03]">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-start">{lang === "ar" ? "الوقت" : "When"}</th>
                <th className="px-4 py-2.5 text-start">{lang === "ar" ? "المستخدم" : "User"}</th>
                <th className="px-4 py-2.5 text-start">{lang === "ar" ? "العملية" : "Action"}</th>
                <th className="px-4 py-2.5 text-start">{lang === "ar" ? "التفاصيل" : "Details"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 tabular-nums whitespace-nowrap" dir="ltr">{new Date(r.at).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })}</td>
                  <td className="px-4 py-2">{name.get(r.user_id) ?? "—"}</td>
                  <td className="px-4 py-2" dir="ltr">{r.action} {r.entity}</td>
                  <td className="px-4 py-2 text-ink/60" dir="ltr">{r.details ? JSON.stringify(r.details) : r.entity_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
