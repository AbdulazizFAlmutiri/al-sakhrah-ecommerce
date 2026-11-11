import { describe, expect, it } from "vitest";
import { NAV_BY_ROLE, canOpen, homeFor } from "@/lib/auth/roles";
import { isValidUsername, normalizeUsername, toAuthEmail } from "@/lib/auth/username";

describe("roles", () => {
  it("routes each role home", () => {
    expect(homeFor("admin")).toBe("/admin/users");
    expect(homeFor("sales")).toBe("/board");
    expect(homeFor("warehouse")).toBe("/warehouse");
    expect(homeFor("driver")).toBe("/driver");
  });
  it("puts each role's home first in its nav", () => {
    for (const role of ["admin", "sales", "warehouse", "driver"] as const) {
      expect(NAV_BY_ROLE[role][0].href).toBe(homeFor(role));
    }
  });
});

describe("username", () => {
  it("normalizes and validates", () => {
    expect(normalizeUsername("  Aref.K ")).toBe("aref.k");
    expect(isValidUsername("aref.k")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("عارف")).toBe(false);
    expect(isValidUsername("a".repeat(33))).toBe(false);
  });
  it("maps to the internal auth email", () => {
    expect(toAuthEmail(" Naeem ")).toBe("naeem@users.ops.local");
  });
});


describe("canOpen", () => {
  it("guards route prefixes", () => {
    expect(canOpen("sales", "/admin/users")).toBe(false);
    expect(canOpen("admin", "/board")).toBe(true);
    expect(canOpen("driver", "/board")).toBe(false);
    expect(canOpen("warehouse", "/warehouse")).toBe(true);
  });
});
