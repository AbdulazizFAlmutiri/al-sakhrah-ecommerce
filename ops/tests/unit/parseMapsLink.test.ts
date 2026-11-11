import { describe, expect, it } from "vitest";
import { parseMapsLink } from "@/lib/maps/parseMapsLink";

describe("parseMapsLink", () => {
  it("prefers the !3d!4d place coordinates over the @ viewport", () => {
    expect(
      parseMapsLink("https://www.google.com/maps/place/Hussain+Top/@24.7000,46.6000,15z/data=!4m6!3m5!1s0x0:0x0!8m2!3d24.7531!4d46.7212"),
    ).toEqual({ lat: 24.7531, lng: 46.7212 });
  });
  it("reads the @lat,lng viewport", () => {
    expect(parseMapsLink("https://www.google.com/maps/@24.7136,46.6753,17z")).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
  it("reads q= and query= parameters", () => {
    expect(parseMapsLink("https://maps.google.com/?q=24.71,46.67")).toEqual({ lat: 24.71, lng: 46.67 });
    expect(parseMapsLink("https://www.google.com/maps/search/?api=1&query=24.71%2C46.67")).toEqual({ lat: 24.71, lng: 46.67 });
  });
  it("reads raw coordinates", () => {
    expect(parseMapsLink(" 24.7136, 46.6753 ")).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
  it("rejects garbage and out-of-range values", () => {
    expect(parseMapsLink("hello")).toBeNull();
    expect(parseMapsLink("124.7, 46.6")).toBeNull();
    expect(parseMapsLink("https://maps.app.goo.gl/abc123")).toBeNull();
  });
});
