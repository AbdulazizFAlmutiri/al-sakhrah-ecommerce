import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getLiveMapData } from "@/lib/trips/queries";
import { ageParts, formatTime } from "@/lib/time";
import { LiveRefresh } from "@/components/orders/LiveRefresh";
import { StatusChip } from "@/components/orders/StatusChip";
import { Icon } from "@/components/ui/Icon";
import { LiveMap, type MapTripView } from "./LiveMap";

const COLORS = ["#0047bb", "#13804a", "#b25e09", "#7b2cbf", "#c4262e", "#00838f"];

export default async function MapPage() {
  await requireRole(["admin", "sales"]);
  const { t } = await getT();
  const { trips, warehouse } = await getLiveMapData();
  const now = new Date();
  const views: MapTripView[] = trips.map((tr, i) => {
    const age = tr.last ? ageParts(tr.last.recorded_at, now) : null;
    return {
      id: tr.id, driver: tr.driver, color: COLORS[i % COLORS.length], polyline: tr.polyline,
      last: tr.last ? { lat: tr.last.lat, lng: tr.last.lng, stale: !!age && (age.h > 0 || age.m >= 3) } : null,
      stops: tr.stops.map((s) => ({ ...s, etaText: s.eta && s.status === "on_the_way" ? formatTime(s.eta) : null })),
    };
  });
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-navy-700">{t("map.title")}</h1>
        <LiveRefresh label={t("board.live")} tables={["orders", "driver_locations", "trips"]} />
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-mist-200/60">
          <LiveMap trips={views} warehouse={warehouse} warehouseLabel={t("map.warehouse")} />
        </div>
        <aside className="flex flex-col gap-3">
          {trips.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-ink-500 shadow-sm">{t("map.no_trips")}</p>}
          {trips.map((tr, i) => {
            const age = tr.last ? ageParts(tr.last.recorded_at, now) : null;
            const stale = !age || age.h > 0 || age.m >= 3;
            const ageText = !age ? "—" : age.h === 0 && age.m === 0 ? t("time.just_now") : age.h === 0 ? t("time.m", { m: age.m }) : t("time.hm", { h: age.h, m: age.m });
            return (
              <section key={tr.id} className="overflow-hidden rounded-2xl bg-white shadow-sm" style={{ borderTop: `4px solid ${COLORS[i % COLORS.length]}` }} data-testid="map-trip">
                <header className="flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2 text-lg font-extrabold"><Icon name="local_shipping" />{tr.driver}</span>
                  <span className={`text-xs font-bold ${stale ? "text-bad-600" : "text-ok-600"}`}>
                    {stale && age ? t("map.stale") + " · " : ""}{t("map.last_seen", { age: ageText })}
                  </span>
                </header>
                <ol className="divide-y divide-mist-200 border-t border-mist-200">
                  {tr.stops.map((s, k) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                      <span><b className="font-[family-name:var(--font-barlow)]">{s.seq ?? k + 1}.</b> {s.name}</span>
                      <span className="flex items-center gap-2">
                        {s.status === "on_the_way" && s.eta && <b className="text-navy-700" dir="ltr">{formatTime(s.eta)}</b>}
                        <StatusChip status={s.status} t={t} />
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
