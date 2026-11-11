import { describe, expect, it } from "vitest";
import { addDays, ageParts, isIsoDate, riyadhToday } from "@/lib/time";

describe("time", () => {
  it("uses the Riyadh calendar day", () => {
    // 22:30 UTC is 01:30 next day in Riyadh (UTC+3)
    expect(riyadhToday(new Date("2026-11-11T22:30:00Z"))).toBe("2026-11-12");
    expect(riyadhToday(new Date("2026-11-11T08:00:00Z"))).toBe("2026-11-11");
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("validates ISO dates", () => {
    expect(isIsoDate("2026-11-11")).toBe(true);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("11/11/2026")).toBe(false);
  });
  it("splits an age into hours and minutes", () => {
    const now = new Date("2026-11-11T10:00:00Z");
    expect(ageParts("2026-11-11T09:58:30Z", now)).toEqual({ h: 0, m: 1 });
    expect(ageParts("2026-11-11T07:35:00Z", now)).toEqual({ h: 2, m: 25 });
    expect(ageParts("2026-11-11T10:05:00Z", now)).toEqual({ h: 0, m: 0 });
  });
});
