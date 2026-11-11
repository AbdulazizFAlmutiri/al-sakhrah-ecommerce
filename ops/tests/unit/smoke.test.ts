import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("brand assets", () => {
  it("ships both logo SVGs with a viewBox", () => {
    for (const f of ["public/brand/logo.svg", "public/brand/logo-mark.svg"]) {
      const svg = readFileSync(f, "utf8");
      expect(svg).toMatch(/<svg[^>]*viewBox=/);
    }
  });
});
