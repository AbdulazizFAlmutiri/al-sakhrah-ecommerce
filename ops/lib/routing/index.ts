import "server-only";
import { planGoogle } from "./google";
import { etasFor, planLocal, type Pt, type RoutePlan, type Stop } from "./local";

/** Optimise stop order (Google when GOOGLE_ROUTES_API_KEY is set, local heuristic otherwise). */
export async function planRoute(origin: Pt, stops: Stop[], start = new Date()): Promise<RoutePlan> {
  const key = process.env.GOOGLE_ROUTES_API_KEY;
  if (key) {
    const g = await planGoogle(origin, stops, start, key);
    if (g) return g;
  }
  return planLocal(origin, stops, start);
}

/** Recompute ETAs for the remaining stops in their current order, from the driver's position. */
export async function refreshEtas(origin: Pt, seq: Stop[], start = new Date()): Promise<RoutePlan> {
  const key = process.env.GOOGLE_ROUTES_API_KEY;
  if (key && seq.length) {
    const g = await planGoogle(origin, seq, start, key, true);
    if (g) return g;
  }
  const { etas, distanceM } = etasFor(origin, seq, start);
  return { order: seq.map((s) => s.id), etas, distanceM, polyline: null, source: "local" };
}
