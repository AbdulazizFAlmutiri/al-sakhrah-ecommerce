import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getActiveDrivers, getOrdersForDate } from "@/lib/orders/queries";
import { groupByDriver } from "@/lib/orders/group";
import { riyadhToday } from "@/lib/time";
import { LiveRefresh } from "@/components/orders/LiveRefresh";
import { Icon } from "@/components/ui/Icon";
import { ReadyButton } from "./ReadyButton";

export default async function WarehousePage() {
  await requireRole(["admin", "warehouse"]);
  const { t } = await getT();
  const [orders, drivers] = await Promise.all([getOrdersForDate(riyadhToday()), getActiveDrivers()]);
  const todo = orders.filter((o) => o.status === "new" || o.status === "ready");
  const lanes = groupByDriver(todo, drivers, t("board.external"));
  const labels = { ready: t("wh.ready"), done: t("wh.done"), undo: t("wh.undo"),
    errors: { "wh.error_undo": t("wh.error_undo"), "order.error_transition": t("order.error_transition"), "common.error_generic": t("common.error_generic") } };
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-navy-700">{t("wh.title")}</h1>
        <LiveRefresh label={t("board.live")} />
      </header>
      {lanes.length === 0 ? (
        <p className="bg-white p-10 text-center text-lg text-ink-500 shadow-sm">{t("wh.empty")}</p>
      ) : (
        lanes.map((lane) => (
          <section key={lane.key} className="border-t-4 border-royal-600 bg-white shadow-sm">
            <h2 className="flex items-center gap-2 bg-mist-100 px-4 py-3 text-xl font-extrabold text-navy-700">
              <Icon name={lane.external ? "local_shipping" : "person"} />{lane.label}
            </h2>
            <ul className="divide-y divide-mist-200">
              {lane.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 p-4" data-testid="wh-row">
                  <div>
                    <div className="text-lg font-bold">{o.branch?.customer?.name} — {o.branch?.name}</div>
                    <div className="text-sm text-ink-500">{t("board.po")}: <span dir="ltr">{o.po_number}</span></div>
                  </div>
                  <ReadyButton id={o.id} status={o.status} readyAt={o.ready_at} labels={labels} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
