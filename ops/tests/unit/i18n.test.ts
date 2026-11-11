import { describe, expect, it } from "vitest";
import { LOCALES, dirFor, getDictionary, isLocale, translate } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";

describe("i18n", () => {
  it("has a non-empty string for every key in every locale", () => {
    const keys = Object.keys(en);
    for (const l of LOCALES) {
      const d = getDictionary(l);
      expect(Object.keys(d).sort()).toEqual([...keys].sort());
      for (const k of keys) expect((d as Record<string, string>)[k].trim().length, `${l}:${k}`).toBeGreaterThan(0);
    }
  });

  it("maps direction", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("ur")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });

  it("validates locales", () => {
    expect(isLocale("ur")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("interpolates variables", () => {
    expect(translate(getDictionary("en"), "home.welcome", { name: "Aref" })).toBe("Welcome, Aref");
  });
});
