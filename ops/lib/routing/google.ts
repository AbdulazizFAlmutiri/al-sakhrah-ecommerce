import "server-only";
import type { Pt, RoutePlan, Stop } from "./local";

const SERVICE_MIN = 8;

/** Google Routes API: optimise waypoint order and get leg durations. Returns null on any failure. */
export async function planGoogle(origin: Pt, stops: Stop[], start: Date, key: string, keepOrder = false): Promise<RoutePlan | null> {
  if (stops.length === 0 || stops.length > 25) return null;
  const wp = (p: Pt) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });
  const last = stops[stops.length - 1];
  const body = {
    origin: wp(origin),
    destination: wp(keepOrder ? last : origin),
    intermediates: (keepOrder ? stops.slice(0, -1) : stops).map(wp),
    travelMode: "DRIVE",
    optimizeWaypointOrder: !keepOrder && stops.length > 1,
    languageCode: "ar",
  };
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.optimizedIntermediateWaypointIndex,routes.legs.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { routes?: { optimizedIntermediateWaypointIndex?: number[]; legs?: { duration?: string }[]; distanceMeters?: number; polyline?: { encodedPolyline?: string } }[] };
    const r = json.routes?.[0];
    if (!r?.legs) return null;
    const mids = keepOrder ? stops.slice(0, -1) : stops;
    const idx = r.optimizedIntermediateWaypointIndex && r.optimizedIntermediateWaypointIndex[0] !== -1 ? r.optimizedIntermediateWaypointIndex : mids.map((_, i) => i);
    const seq = keepOrder ? stops : idx.map((i) => mids[i]);
    let t = start.getTime();
    const etas: Record<string, string> = {};
    seq.forEach((s, i) => {
      const secs = parseFloat((r.legs![i]?.duration ?? "0s").replace("s", ""));
      t += secs * 1000 + (i > 0 ? SERVICE_MIN * 60000 : 0);
      etas[s.id] = new Date(t).toISOString();
    });
    return { order: seq.map((s) => s.id), etas, distanceM: r.distanceMeters ?? 0, polyline: r.polyline?.encodedPolyline ?? null, source: "google" };
  } catch {
    return null;
  }
}
