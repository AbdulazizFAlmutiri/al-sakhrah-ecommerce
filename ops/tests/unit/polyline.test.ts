import { describe, expect, it } from "vitest";
import { decodePolyline } from "@/lib/routing/polyline";
import { formatTime } from "@/lib/time";

describe("decodePolyline", () => {
  it("decodes Google's reference example", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
  });
});
describe("formatTime", () => {
  it("formats in Riyadh time", () => { expect(formatTime("2026-11-11T05:42:00Z")).toBe("08:42"); });
});
