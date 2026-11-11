import { describe, expect, it } from "vitest";
import { etasFor, haversineM, orderStops, planLocal } from "@/lib/routing/local";

const wh = { lat: 24.60, lng: 46.70 };
describe("local routing", () => {
  it("measures ~1.02 km per 0.01° of longitude at 24°N", () => {
    expect(Math.round(haversineM({ lat: 24, lng: 46 }, { lat: 24, lng: 46.01 }) / 10) * 10).toBe(1020);
  });
  it("visits collinear stops in distance order regardless of input order", () => {
    const stops = [{ id: "far", lat: 24.60, lng: 46.90 }, { id: "near", lat: 24.60, lng: 46.72 }, { id: "mid", lat: 24.60, lng: 46.80 }];
    expect(orderStops(wh, stops).map((s) => s.id)).toEqual(["near", "mid", "far"]);
  });
  it("2-opt removes a crossing that nearest-neighbour creates", () => {
    const stops = [
      { id: "a", lat: 24.61, lng: 46.70 }, { id: "b", lat: 24.65, lng: 46.75 },
      { id: "c", lat: 24.60, lng: 46.76 }, { id: "d", lat: 24.66, lng: 46.70 },
    ];
    const seq = orderStops(wh, stops);
    const len = (ids: string[]) => { let d = 0, p = wh; for (const id of ids) { const s = stops.find((x) => x.id === id)!; d += haversineM(p, s); p = s; } return d; };
    // no permutation should be shorter than ours by more than 1m
    const perms = (a: string[]): string[][] => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
    const best = Math.min(...perms(["a", "b", "c", "d"]).map(len));
    expect(len(seq.map((s) => s.id))).toBeLessThan(best + 1);
  });
  it("produces increasing ETAs with service time between stops", () => {
    const seq = [{ id: "1", lat: 24.60, lng: 46.72 }, { id: "2", lat: 24.60, lng: 46.74 }];
    const start = new Date("2026-11-11T05:00:00Z");
    const { etas, distanceM } = etasFor(wh, seq, start, { speedKmh: 30, roadFactor: 1, serviceMin: 8 });
    const t1 = new Date(etas["1"]).getTime() - start.getTime();
    const t2 = new Date(etas["2"]).getTime() - new Date(etas["1"]).getTime();
    expect(Math.round(t1 / 1000)).toBe(Math.round((haversineM(wh, seq[0]) / (30000 / 3600))));
    expect(t2).toBeGreaterThan(8 * 60000);
    expect(distanceM).toBeGreaterThan(3900);
  });
  it("plans an empty trip without errors", () => {
    expect(planLocal(wh, [], new Date()).order).toEqual([]);
  });
});
