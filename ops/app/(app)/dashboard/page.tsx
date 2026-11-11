import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { filtersToQuery, getDashboardData, getFilterOptions, getOrderDetail, parseFilters } from "@/lib/dashboard/queries";
import { avgMinutes, groupRows, kpis, reasonCounts, type Row } from "@/lib/dashboard/stats";
import { formatTime } from "@/lib/time";
import { StatusChip } from "@/components/orders/StatusChip";
import { Icon } from "@/components/ui/Icon";
import type { OrderStatus } from "@/lib/orders/status";
import type { T } from "@/lib/i18n";

const PRESETS = ["today", "yesterday", "week", "month"] as const;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(["admin", "sales"]);
  const sp = await searchParams;
  const f = parseFilters(sp);
  const orderId = typeof sp.order === "string" ? sp.order : null;
  const { t, locale } = await getT();
  const [{ orders, tripStats }, opts, detail] = await Promise.all([
    getDashboardData(f), getFilterOptions(), orderId ? getOrderDetail(orderId) : Promise.resolve(null),
  ]);
  const k = kpis(orders);
  const label = (r: { label_ar: string; label_en: string; label_ur: string }) => (locale === "en" ? r.label_en : locale === "ur" ? r.label_ur : r.label_ar);
  const reasonById = new Map(opts.reasons.map((r) => [r.id, r]));
  const byDriver = groupRows(orders, (o) => (o.external ? t("board.external") : o.driver));
  const byRep = groupRows(orders, (o) => o.rep);
  const byCustomer = groupRows(orders, (o) => o.customer);
  const reasons = reasonCounts(orders);
  const toReady = avgMinutes(orders, "created_at", "ready_at");
  const toDeliver = avgMinutes(orders, "ready_at", "delivered_at");
  const selected = detail && orderId ? orders.find((o) => o.id === orderId) : null;
  const sel = "h-10 border border-mist-300 bg-white px-2 text-sm";

  const tiles: { key: string; label: string; value: string; color: string; icon: string }[] = [
    { key: "total", label: t("dash.total"), value: String(k.total), color: "text-navy-700", icon: "inventory_2" },
    { key: "new", label: t("status.new"), value: String(k.new), color: "text-warn-600", icon: "hourglass_top" },
    { key: "ready", label: t("status.ready"), value: String(k.ready), color: "text-royal-600", icon: "inventory" },
    { key: "otw", label: t("status.on_the_way"), value: String(k.on_the_way), color: "text-royal-600", icon: "local_shipping" },
    { key: "del", label: t("status.delivered"), value: String(k.delivered), color: "text-ok-600", icon: "check_circle" },
    { key: "fail", label: t("status.failed"), value: String(k.failed), color: "text-bad-600", icon: "cancel" },
    { key: "succ", label: t("dash.success"), value: k.successPct === null ? "—" : `${k.successPct}%`, color: "text-ok-600", icon: "verified" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-navy-700">{t("dash.title")}</h1>
        <a href={`/dashboard/export${filtersToQuery(f)}`} download className="flex h-10 items-center gap-2 bg-ok-600 px-4 text-sm font-bold text-white" data-testid="export">
          <Icon name="download" />{t("dash.export")}
        </a>
      </header>

      {/* filters */}
      <form className="flex flex-wrap items-end gap-2 bg-white p-4 shadow-sm" method="get">
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <Link key={p} href={`/dashboard${filtersToQuery({ ...f, preset: p })}`}
              className={`flex h-10 items-center px-3 text-sm font-bold ${f.preset === p ? "bg-royal-600 text-white" : "bg-mist-100 text-navy-700"}`}>{t(`dash.${p}` as const)}</Link>
          ))}
        </div>
        <label className="flex flex-col text-xs">{t("dash.from")}<input type="date" name="from" defaultValue={f.from} className={sel} dir="ltr" /></label>
        <label className="flex flex-col text-xs">{t("dash.to")}<input type="date" name="to" defaultValue={f.to} className={sel} dir="ltr" /></label>
        <select name="driver" defaultValue={f.driver} className={sel} aria-label={t("dash.col_driver")}>
          <option value="">{t("dash.all_drivers")}</option>
          {opts.drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.full_name}</option>)}
          <option value="external">{t("board.external")}</option>
        </select>
        <select name="rep" defaultValue={f.rep} className={sel} aria-label={t("dash.col_rep")}>
          <option value="">{t("dash.all_reps")}</option>
          {opts.reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select name="customer" defaultValue={f.customer} className={sel} aria-label={t("dash.col_store")}>
          <option value="">{t("dash.all_customers")}</option>
          {opts.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="h-10 bg-navy-700 px-4 text-sm font-bold text-white">{t("dash.apply")}</button>
      </form>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {tiles.map((x) => (
          <div key={x.key} className="border-t-4 border-royal-600 bg-white p-4 shadow-sm" data-testid={`kpi-${x.key}`}>
            <div className="flex items-center justify-between text-sm text-ink-500">{x.label}<Icon name={x.icon} className={`text-2xl ${x.color}`} /></div>
            <div className={`mt-2 font-[family-name:var(--font-barlow)] text-4xl font-bold ${x.color}`}>{x.value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Timing label={t("dash.time_to_ready")} v={toReady} t={t} />
        <Timing label={t("dash.time_to_deliver")} v={toDeliver} t={t} />
      </div>

      {/* breakdowns */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Breakdown title={t("dash.by_driver")} rows={byDriver} t={t} extra={(r) => {
          const s = tripStats.get(r.key);
          return [s?.trips ?? 0, s ? s.km.toFixed(1) : "0"];
        }} extraHeads={[t("dash.col_trips"), t("dash.col_km")]} />
        <Breakdown title={t("dash.by_rep")} rows={byRep} t={t} />
        <Breakdown title={t("dash.by_customer")} rows={byCustomer} t={t} />
        <section className="border-t-4 border-bad-600 bg-white shadow-sm">
          <h2 className="px-4 py-3 font-extrabold text-navy-700">{t("dash.reasons")}</h2>
          <ul className="divide-y divide-mist-200">
            {reasons.length === 0 && <li className="px-4 py-3 text-sm text-ink-500">—</li>}
            {reasons.map((r) => {
              const meta = r.reason_id ? reasonById.get(r.reason_id) : undefined;
              const max = reasons[0].count;
              return (
                <li key={r.reason_id ?? "none"} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <Icon name={meta?.icon ?? "help"} className="text-bad-600" />
                  <span className="w-40">{meta ? label(meta) : t("failed.no_reason")}</span>
                  <span className="h-3 bg-bad-600" style={{ width: `${(r.count / max) * 50}%` }} />
                  <b>{r.count}</b>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* order table */}
      <section className="border-t-4 border-royal-600 bg-white shadow-sm">
        <h2 className="px-4 py-3 font-extrabold text-navy-700">{t("dash.orders_table")} ({orders.length})</h2>
        {orders.length === 0 ? <p className="p-8 text-center text-ink-500">{t("dash.empty")}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mist-100 text-start text-xs text-ink-500">
                <tr>{[t("dash.col_date"), t("dash.col_store"), t("dash.col_driver"), t("dash.col_rep"), t("dash.col_po"), t("dash.col_status"), ""].map((h, i) => <th key={i} className="px-3 py-2 text-start font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-mist-200">
                {orders.slice(0, 300).map((o) => (
                  <tr key={o.id} className={o.id === orderId ? "bg-royal-50" : ""} data-testid="dash-row">
                    <td className="px-3 py-2" dir="ltr">{o.delivery_date}</td>
                    <td className="px-3 py-2 font-bold">{o.customer} — {o.branch}</td>
                    <td className="px-3 py-2">{o.external ? t("board.external") : o.driver}</td>
                    <td className="px-3 py-2">{o.rep}</td>
                    <td className="px-3 py-2" dir="ltr">{o.po_number}</td>
                    <td className="px-3 py-2"><StatusChip status={o.status as OrderStatus} t={t} /></td>
                    <td className="px-3 py-2"><Link href={`/dashboard${filtersToQuery(f, { order: o.id })}`} className="font-bold text-royal-600">{t("dash.view")}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* order detail drawer */}
      {selected && detail && (
        <aside className="fixed inset-y-0 end-0 z-40 flex w-full max-w-md flex-col overflow-auto bg-white shadow-2xl" data-testid="order-detail">
          <header className="flex items-center justify-between border-b-4 border-royal-600 bg-mist-100 px-4 py-3">
            <div>
              <div className="font-extrabold text-navy-700">{selected.customer} — {selected.branch}</div>
              <div className="text-xs text-ink-500" dir="ltr">{selected.po_number}</div>
            </div>
            <Link href={`/dashboard${filtersToQuery(f)}`} aria-label={t("dash.close")} className="p-2"><Icon name="close" /></Link>
          </header>
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="mb-2 font-bold text-navy-700">{t("dash.photo")}</h3>
              {detail.photoUrl
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                ? <a href={detail.photoUrl} target="_blank" rel="noreferrer"><img src={detail.photoUrl} alt={t("dash.photo")} className="max-h-96 w-full bg-mist-100 object-contain" /></a>
                : <p className="bg-mist-50 p-4 text-sm text-ink-500">{t("dash.no_photo")}</p>}
              {detail.proof?.far_from_store && <p className="mt-2 flex items-center gap-1 text-sm font-bold text-warn-600"><Icon name="wrong_location" />{t("board.far")}</p>}
            </div>
            <div>
              <h3 className="mb-2 font-bold text-navy-700">{t("dash.timeline")}</h3>
              <ol className="relative border-s-2 border-royal-100 ps-4">
                <li className="mb-3 text-sm"><b>{t("dash.created")}</b> · <span dir="ltr">{formatTime(selected.created_at)}</span></li>
                {detail.events.map((e, i) => {
                  const m = (e.meta ?? {}) as Record<string, unknown>;
                  const r = typeof m.reason_id === "string" ? reasonById.get(m.reason_id) : undefined;
                  return (
                    <li key={i} className="mb-3 text-sm">
                      <div className="flex items-center gap-2"><StatusChip status={e.to_status as OrderStatus} t={t} /><span dir="ltr" className="text-ink-500">{formatTime(e.created_at)}</span></div>
                      <div className="mt-1 text-ink-500">{e.actor}{r ? ` · ${label(r)}` : ""}{typeof m.note === "string" ? ` · ${m.note}` : ""}</div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

function Timing({ label, v, t }: { label: string; v: number | null; t: T }) {
  return (
    <div className="flex items-center justify-between bg-white p-4 shadow-sm">
      <span className="flex items-center gap-2 text-sm text-ink-500"><Icon name="timer" className="text-royal-600" />{label}</span>
      <b className="font-[family-name:var(--font-barlow)] text-2xl text-navy-700">{v === null ? "—" : t("dash.minutes", { n: v })}</b>
    </div>
  );
}

function Breakdown({ title, rows, t, extra, extraHeads = [] }: { title: string; rows: Row[]; t: T; extra?: (r: Row) => (string | number)[]; extraHeads?: string[] }) {
  return (
    <section className="border-t-4 border-royal-600 bg-white shadow-sm">
      <h2 className="px-4 py-3 font-extrabold text-navy-700">{title}</h2>
      <table className="w-full text-sm">
        <thead className="bg-mist-100 text-xs text-ink-500">
          <tr>{["", t("dash.col_orders"), t("dash.col_delivered"), t("dash.col_failed"), t("dash.col_success"), ...extraHeads].map((h, i) => <th key={i} className="px-3 py-2 text-start font-bold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-mist-200">
          {rows.length === 0 && <tr><td className="px-3 py-3 text-ink-500" colSpan={5 + extraHeads.length}>—</td></tr>}
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="px-3 py-2 font-bold">{r.key}</td>
              <td className="px-3 py-2">{r.orders}</td>
              <td className="px-3 py-2 text-ok-600">{r.delivered}</td>
              <td className="px-3 py-2 text-bad-600">{r.failed}</td>
              <td className="px-3 py-2">{r.successPct === null ? "—" : `${r.successPct}%`}</td>
              {extra?.(r).map((x, i) => <td key={i} className="px-3 py-2">{x}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
