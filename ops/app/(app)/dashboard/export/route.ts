import ExcelJS from "exceljs";
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getDashboardData, getFilterOptions, parseFilters } from "@/lib/dashboard/queries";
import { groupRows, kpis } from "@/lib/dashboard/stats";
import { formatTime } from "@/lib/time";

export async function GET(req: Request) {
  await requireRole(["admin", "sales"]);
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const f = parseFilters(sp);
  const { t, locale } = await getT();
  const [{ orders }, opts] = await Promise.all([getDashboardData(f), getFilterOptions()]);
  const reasonById = new Map(opts.reasons.map((r) => [r.id, locale === "en" ? r.label_en : locale === "ur" ? r.label_ur : r.label_ar]));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Al-Sakhrah Ops";
  const rtl = locale !== "en";
  const head = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003087" } };
    ws.views = [{ rightToLeft: rtl, state: "frozen", ySplit: 1 }];
  };

  const ws = wb.addWorksheet(t("dash.orders_table"));
  ws.columns = [
    { header: t("dash.col_date"), key: "date", width: 12 },
    { header: t("dash.col_store"), key: "store", width: 34 },
    { header: t("dash.col_driver"), key: "driver", width: 18 },
    { header: t("dash.col_rep"), key: "rep", width: 16 },
    { header: t("dash.col_po"), key: "po", width: 16 },
    { header: t("dash.col_status"), key: "status", width: 18 },
    { header: t("board.reason"), key: "reason", width: 20 },
    { header: t("dash.created"), key: "created", width: 10 },
    { header: t("status.ready"), key: "ready", width: 10 },
    { header: t("status.delivered"), key: "delivered", width: 10 },
  ];
  for (const o of orders) {
    ws.addRow({
      date: o.delivery_date, store: `${o.customer ?? ""} — ${o.branch ?? ""}`, driver: o.external ? t("board.external") : o.driver ?? "",
      rep: o.rep ?? "", po: o.po_number, status: t(`status.${o.status}` as Parameters<typeof t>[0]),
      reason: o.reason_id ? reasonById.get(o.reason_id) ?? "" : "", created: formatTime(o.created_at),
      ready: o.ready_at ? formatTime(o.ready_at) : "", delivered: o.delivered_at ? formatTime(o.delivered_at) : "",
    });
  }
  head(ws);

  const k = kpis(orders);
  const sum = wb.addWorksheet(t("dash.title"));
  sum.columns = [{ header: "", key: "a", width: 30 }, { header: "", key: "b", width: 14 }, { header: "", key: "c", width: 14 }, { header: "", key: "d", width: 14 }, { header: "", key: "e", width: 14 }];
  sum.getRow(1).values = [`${t("dash.from")} ${f.from}`, `${t("dash.to")} ${f.to}`];
  sum.addRows([
    [t("dash.total"), k.total], [t("status.delivered"), k.delivered], [t("status.failed"), k.failed],
    [t("dash.success"), k.successPct === null ? "—" : `${k.successPct}%`], [],
    [t("dash.by_driver"), t("dash.col_orders"), t("dash.col_delivered"), t("dash.col_failed"), t("dash.col_success")],
    ...groupRows(orders, (o) => (o.external ? t("board.external") : o.driver)).map((r) => [r.key, r.orders, r.delivered, r.failed, r.successPct === null ? "—" : `${r.successPct}%`]),
  ]);
  head(sum);

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="al-sakhrah-orders-${f.from}_${f.to}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
