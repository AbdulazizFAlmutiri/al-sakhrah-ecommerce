import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getActiveDrivers, getFailedOrders, getReasons } from "@/lib/orders/queries";
import { addDays, riyadhToday } from "@/lib/time";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { FailedActions } from "./FailedRow";

export default async function FailedPage() {
  await requireRole(["admin", "sales"]);
  const { t, locale } = await getT();
  const [failed, drivers, reasons] = await Promise.all([getFailedOrders(), getActiveDrivers(), getReasons()]);
  const reasonById = new Map(reasons.map((r) => [r.id, r]));
  const tomorrow = addDays(riyadhToday(), 1);
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-SA-u-nu-latn-ca-gregory", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  const labels = {
    reschedule: t("failed.reschedule"), cancel: t("failed.cancel"), date: t("order.date"), driver: t("order.driver"),
    external: t("board.external"), note: t("board.note"), choose: t("order.choose"),
    errors: { "order.error_required": t("order.error_required"), "order.error_transition": t("order.error_transition"),
      "order.error_driver": t("order.error_driver"), "common.error_generic": t("common.error_generic") },
  };
  return (
    <Card title={t("failed.title")} eyebrow="Not delivered">
      {failed.length === 0 ? (
        <p className="py-10 text-center text-ink-500">{t("failed.empty")}</p>
      ) : (
        <ul className="divide-y divide-mist-200">
          {failed.map((o) => {
            const r = o.reason_id ? reasonById.get(o.reason_id) : undefined;
            const label = r ? (locale === "en" ? r.label_en : locale === "ur" ? r.label_ur : r.label_ar) : t("failed.no_reason");
            return (
              <li key={o.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_auto]" data-testid="failed-row">
                <div>
                  <div className="text-lg font-bold">{o.branch?.customer?.name} — {o.branch?.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">
                    <span className="flex items-center gap-1 font-bold text-bad-600"><Icon name={r?.icon ?? "help"} />{label}</span>
                    <span>{t("board.po")}: <span dir="ltr">{o.po_number}</span></span>
                    <span dir="ltr">{fmt.format(new Date(o.failed_at))}</span>
                  </div>
                  {o.note && <p className="mt-2 bg-mist-50 p-2 text-sm">{o.note}</p>}
                </div>
                <FailedActions id={o.id} defaultDate={tomorrow} drivers={drivers} labels={labels} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
