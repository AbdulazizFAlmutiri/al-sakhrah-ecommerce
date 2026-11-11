import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getActiveDrivers, getFailedOrders, getOrdersForDate, getReasons } from "@/lib/orders/queries";
import { groupByDriver } from "@/lib/orders/group";
import { addDays, formatTime, isIsoDate, riyadhToday } from "@/lib/time";
import { ORDER_STATUSES } from "@/lib/orders/status";
import { Age } from "@/components/orders/Age";
import { LiveRefresh } from "@/components/orders/LiveRefresh";
import { StatusChip } from "@/components/orders/StatusChip";
import { Icon } from "@/components/ui/Icon";
import { OrderCardActions } from "./OrderCard";

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireRole(["admin", "sales"]);
  const { date: raw } = await searchParams;
  const today = riyadhToday();
  const date = raw && isIsoDate(raw) ? raw : today;
  const { t, locale } = await getT();
  const [orders, drivers, failed, reasons] = await Promise.all([getOrdersForDate(date), getActiveDrivers(), getFailedOrders(), getReasons()]);
  const lanes = groupByDriver(orders, drivers, t("board.external"));
  const now = new Date();
  const counts = ORDER_STATUSES.filter((s) => s !== "cancelled").map((s) => [s, orders.filter((o) => o.status === s).length] as const);
  const reasonOpts = reasons.map((r) => ({ id: r.id, icon: r.icon, label: locale === "en" ? r.label_en : locale === "ur" ? r.label_ur : r.label_ar }));
  const cardLabels = {
    rep: t("board.rep"), po: t("board.po"), cancel: t("board.cancel"), delivered: t("board.mark_delivered"), failed: t("board.mark_failed"),
    reason: t("board.reason"), note: t("board.note"), confirm: t("board.confirm"), choose: t("order.choose"),
    errors: { "order.error_transition": t("order.error_transition"), "common.error_generic": t("common.error_generic"), "common.not_authorized": t("common.not_authorized") },
  };
  const dayLabel = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale === "ur" ? "ur-PK" : "ar-SA-u-nu-latn-ca-gregory", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-navy-700">{t("board.title")}</h1>
          <LiveRefresh label={t("board.live")} />
        </div>
        <nav className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
          <Link href={`/board?date=${addDays(date, -1)}`} className="rounded-lg p-2 hover:bg-royal-50" aria-label={t("board.prev_day")}><Icon name="chevron_right" className="rtl:rotate-0 ltr:rotate-180" /></Link>
          <span className="min-w-44 px-2 text-center font-bold">{date === today ? `${t("board.today")} · ` : ""}{dayLabel}</span>
          <Link href={`/board?date=${addDays(date, 1)}`} className="rounded-lg p-2 hover:bg-royal-50" aria-label={t("board.next_day")}><Icon name="chevron_left" className="rtl:rotate-0 ltr:rotate-180" /></Link>
          {date !== today && <Link href="/board" className="px-3 py-2 text-sm font-bold text-royal-600">{t("board.today")}</Link>}
        </nav>
        <div className="flex gap-2">
          {failed.length > 0 && (
            <Link href="/board/failed" className="flex h-10 items-center gap-2 rounded-xl bg-bad-50 px-4 text-sm font-bold text-bad-600">
              <Icon name="assignment_late" />{t("nav.failed")} ({failed.length})
            </Link>
          )}
          <Link href="/board/new" className="flex h-10 items-center gap-2 rounded-xl bg-royal-600 px-4 text-sm font-bold text-white hover:bg-royal-700">
            <Icon name="add" />{t("nav.new_order")}
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {counts.map(([s, n]) => (
          <span key={s} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
            <StatusChip status={s} t={t} /><b className="font-[family-name:var(--font-barlow)] text-lg">{n}</b>
          </span>
        ))}
      </div>

      {lanes.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-ink-500 shadow-sm">{t("board.empty")}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {lanes.map((lane) => (
            <section key={lane.key} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-mist-200/60">
              <header className="flex items-center justify-between border-b border-mist-100 bg-mist-50 px-4 py-3">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-700">
                  <Icon name={lane.external ? "local_shipping" : "person"} />{lane.label}
                </h2>
                <span className="text-sm text-ink-500">{t("board.orders_n", { n: lane.orders.length })}</span>
              </header>
              <ol className="divide-y divide-mist-200">
                {lane.orders.map((o, i) => (
                  <li key={o.id} className="p-4" data-testid="order-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy-700 font-[family-name:var(--font-barlow)] text-sm font-bold text-white">{o.stop_seq ?? i + 1}</span>
                        <div>
                          <div className="font-bold">{o.branch?.customer?.name} — {o.branch?.name}</div>
                          <div className="mt-1 text-xs text-ink-500">
                            {t("board.rep")}: {o.rep?.name} · {t("board.po")}: <span dir="ltr">{o.po_number}</span>
                          </div>
                          {o.notes && <div className="mt-1 text-xs text-warn-600">{o.notes}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusChip status={o.status} t={t} />
                        <Age since={o.status_changed_at} t={t} now={now} />
                        {o.status === "on_the_way" && o.eta && <span className="text-xs font-bold text-navy-700">{t("board.eta", { time: formatTime(o.eta) })}</span>}
                      </div>
                    </div>
                    <OrderCardActions id={o.id} status={o.status} external={o.external} reasons={reasonOpts} labels={cardLabels} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
