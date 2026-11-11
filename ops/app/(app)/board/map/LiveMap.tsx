"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap, LayerGroup } from "leaflet";
import { decodePolyline } from "@/lib/routing/polyline";

export type MapTripView = {
  id: string; driver: string; color: string; polyline: string | null;
  last: { lat: number; lng: number; stale: boolean } | null;
  stops: { id: string; seq: number | null; status: string; name: string; lat: number; lng: number; etaText: string | null }[];
};

const STATUS_COLOR: Record<string, string> = { on_the_way: "#0047bb", delivered: "#13804a", failed: "#c4262e" };
const RIYADH: [number, number] = [24.7136, 46.6753];

export function LiveMap({ trips, warehouse, warehouseLabel }: { trips: MapTripView[]; warehouse: { lat: number; lng: number } | null; warehouseLabel: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      if (!map.current) {
        map.current = L.map(el.current, { zoomControl: true, attributionControl: true }).setView(RIYADH, 11);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
      }
      const g = layer.current!;
      g.clearLayers();
      const bounds: [number, number][] = [];
      if (warehouse) {
        L.marker([warehouse.lat, warehouse.lng], { icon: L.divIcon({ className: "", html: `<div style="background:#003087;color:#fff;padding:4px 8px;font:700 12px Almarai,sans-serif;white-space:nowrap"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">factory</span> ${warehouseLabel}</div>`, iconAnchor: [20, 12] }) }).addTo(g);
        bounds.push([warehouse.lat, warehouse.lng]);
      }
      for (const t of trips) {
        const open = t.stops.filter((s) => s.status === "on_the_way");
        const line: [number, number][] = t.polyline ? decodePolyline(t.polyline)
          : [...(t.last ? [[t.last.lat, t.last.lng] as [number, number]] : []), ...open.map((s) => [s.lat, s.lng] as [number, number])];
        if (line.length > 1) L.polyline(line, { color: t.color, weight: 5, opacity: 0.8, dashArray: t.polyline ? undefined : "10 8" }).addTo(g);
        for (const s of t.stops) {
          const c = STATUS_COLOR[s.status] ?? "#5d6b88";
          L.marker([s.lat, s.lng], { icon: L.divIcon({ className: "", iconSize: [30, 30], iconAnchor: [15, 15],
            html: `<div style="width:30px;height:30px;border-radius:50%;background:#fff;border:4px solid ${c};display:grid;place-items:center;font:800 13px Barlow,sans-serif;color:${c}">${s.status === "delivered" ? "✓" : s.status === "failed" ? "✕" : (s.seq ?? "")}</div>` }) })
            .bindTooltip(`${s.name}${s.etaText ? " · " + s.etaText : ""}`, { direction: "top" }).addTo(g);
          bounds.push([s.lat, s.lng]);
        }
        if (t.last) {
          L.marker([t.last.lat, t.last.lng], { zIndexOffset: 1000, icon: L.divIcon({ className: "", iconAnchor: [16, 16],
            html: `<div style="display:flex;align-items:center;gap:6px;background:${t.last.stale ? "#5d6b88" : t.color};color:#fff;padding:6px 10px;font:700 13px Almarai,sans-serif;white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,.25)"><span class="material-symbols-outlined" style="font-size:18px">local_shipping</span>${t.driver}</div>` }) }).addTo(g);
          bounds.push([t.last.lat, t.last.lng]);
        }
      }
      if (!fitted.current && bounds.length > 1) { map.current!.fitBounds(bounds, { padding: [40, 40] }); fitted.current = true; }
    })();
    return () => { cancelled = true; };
  }, [trips, warehouse, warehouseLabel]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);
  return <div ref={el} className="h-[70vh] w-full overflow-hidden rounded-2xl bg-mist-100 shadow-sm" data-testid="live-map" />;
}
