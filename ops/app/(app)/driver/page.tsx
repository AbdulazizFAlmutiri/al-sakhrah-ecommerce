import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getReasons } from "@/lib/orders/queries";
import { getDriverView, type DriverOrder } from "@/lib/trips/queries";
import { formatTime, riyadhToday } from "@/lib/time";
import { DriverApp, type DStop } from "./DriverApp";

export default async function DriverPage() {
  const user = await requireRole(["driver"]);
  const { t, locale } = await getT();
  const [view, reasons] = await Promise.all([getDriverView(user.id, riyadhToday()), getReasons()]);
  const toStop = (o: DriverOrder): DStop => ({
    id: o.id, status: o.status, seq: o.stop_seq, eta: o.eta, etaText: o.eta ? t("drv.eta", { time: formatTime(o.eta) }) : null,
    po: o.po_number, notes: o.notes, store: o.branch?.customer?.name ?? "", branch: o.branch?.name ?? "",
    lat: o.branch?.lat ?? 0, lng: o.branch?.lng ?? 0, phone: o.branch?.phone ?? null,
  });
  const labelOf = (r: { label_ar: string; label_en: string; label_ur: string }) => (locale === "en" ? r.label_en : locale === "ur" ? r.label_ur : r.label_ar);
  return (
    <DriverApp
      userId={user.id}
      tripActive={!!view.trip}
      stops={view.stops.map(toStop)}
      waiting={view.waiting.map(toStop)}
      reasons={reasons.map((r) => ({ id: r.id, icon: r.icon, label: labelOf(r) }))}
      labels={{
        start: t("drv.start"), end: t("drv.end"), preparing: t("drv.preparing"), readyN: t("drv.ready_n"), noOrders: t("drv.no_orders"),
        navigate: t("drv.navigate"), delivered: t("drv.delivered"), failed: t("drv.failed"), takePhoto: t("drv.take_photo"),
        retake: t("drv.retake"), confirm: t("drv.confirm"), cancel: t("drv.cancel"), uploading: t("drv.uploading"),
        chooseReason: t("drv.choose_reason"), next: t("drv.next"), doneTitle: t("drv.done_title"), doneHint: t("drv.done_hint"),
        gpsOff: t("drv.gps_off"), offline: t("drv.offline"), tracking: t("drv.tracking"), note: t("board.note"),
        errors: {
          "drv.error_photo": t("drv.error_photo"), "drv.error_trip": t("drv.error_trip"), "drv.stops_remaining": t("drv.stops_remaining"),
          "common.error_generic": t("common.error_generic"),
        },
      }}
    />
  );
}
