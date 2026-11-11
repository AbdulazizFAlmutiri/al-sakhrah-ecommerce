import { describe, expect, it } from "vitest";
import { dbErrorKey } from "@/lib/db/errors";

describe("dbErrorKey", () => {
  it("maps known database errors to message keys", () => {
    expect(dbErrorKey("username_taken")).toBe("users.error_taken");
    expect(dbErrorKey('ERROR: invalid_username')).toBe("users.error_invalid_username");
    expect(dbErrorKey("weak_password")).toBe("users.error_weak_password");
    expect(dbErrorKey("cannot_modify_self")).toBe("users.error_self");
    expect(dbErrorKey("not_authorized")).toBe("common.not_authorized");
    expect(dbErrorKey('duplicate key value violates unique constraint "sales_reps_name_key"')).toBe("settings.error_rep_taken");
    expect(dbErrorKey("something else")).toBe("common.error_generic");
  });
});
