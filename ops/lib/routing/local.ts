export type Pt = { lat: number; lng: number };
export type Stop = Pt & { id: string };
export type RoutePlan = { order: string[]; etas: Record<string, string>; distanceM: number; polyline: string | null; source: "google" | "local" };

const R = 6371000;
export function haversineM(a: Pt, b: Pt): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type LocalOpts = { speedKmh?: number; roadFactor?: number; serviceMin?: number };
const DEFAULTS = { speedKmh: 30, roadFactor: 1.35, serviceMin: 8 };

function pathLength(origin: Pt, seq: Stop[]): number {
  let d = 0, prev: Pt = origin;
  for (const s of seq) { d += haversineM(prev, s); prev = s; }
  return d;
}

/** Nearest-neighbour tour from origin (open path), improved with 2-opt. Deterministic. */
export function orderStops(origin: Pt, stops: Stop[]): Stop[] {
  const left = [...stops];
  const seq: Stop[] = [];
  let cur: Pt = origin;
  while (left.length) {
    let bi = 0, bd = Infinity;
    left.forEach((s, i) => { const d = haversineM(cur, s); if (d < bd - 1e-9) { bd = d; bi = i; } });
    cur = left[bi]; seq.push(left.splice(bi, 1)[0]);
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < seq.length - 1; i++) {
      for (let k = i + 1; k < seq.length; k++) {
        const cand = [...seq.slice(0, i), ...seq.slice(i, k + 1).reverse(), ...seq.slice(k + 1)];
        if (pathLength(origin, cand) + 1e-6 < pathLength(origin, seq)) { seq.splice(0, seq.length, ...cand); improved = true; }
      }
    }
  }
  return seq;
}

/** ETAs along a fixed sequence: road distance ≈ straight line × roadFactor at speedKmh, plus service time at each stop. */
export function etasFor(origin: Pt, seq: Stop[], start: Date, opts: LocalOpts = {}): { etas: Record<string, string>; distanceM: number } {
  const o = { ...DEFAULTS, ...opts };
  const mps = (o.speedKmh * 1000) / 3600;
  let t = start.getTime(), prev: Pt = origin, dist = 0;
  const etas: Record<string, string> = {};
  seq.forEach((s, i) => {
    const leg = haversineM(prev, s) * o.roadFactor;
    dist += leg;
    t += (leg / mps) * 1000 + (i > 0 ? o.serviceMin * 60000 : 0);
    etas[s.id] = new Date(t).toISOString();
    prev = s;
  });
  return { etas, distanceM: Math.round(dist) };
}

export function planLocal(origin: Pt, stops: Stop[], start: Date, opts: LocalOpts = {}): RoutePlan {
  const seq = orderStops(origin, stops);
  const { etas, distanceM } = etasFor(origin, seq, start, opts);
  return { order: seq.map((s) => s.id), etas, distanceM, polyline: null, source: "local" };
}
