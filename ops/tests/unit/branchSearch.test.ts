import { describe, expect, it } from "vitest";
import { matchBranches, normalizeAr } from "@/lib/customers/branchSearch";

const list = [
  { id: "1", customer: "الحسين توب", name: "مخرج ٦" },
  { id: "2", customer: "الحسين توب", name: "الربوة" },
  { id: "3", customer: "البيت السوري", name: "النهضة" },
  { id: "4", customer: "مترو ماركت", name: "لبن" },
];

describe("branch search", () => {
  it("normalizes alef, ya, ta marbuta, tashkeel and Arabic digits", () => {
    expect(normalizeAr("إسْتراحة  مُنى ٦")).toBe("استراحه مني 6");
  });
  it("matches all tokens across customer and branch name", () => {
    expect(matchBranches("حسين ربوه", list).map((b) => b.id)).toEqual(["2"]);
    expect(matchBranches("حسين", list).map((b) => b.id)).toEqual(["1", "2"]);
    expect(matchBranches("مخرج 6", list).map((b) => b.id)).toEqual(["1"]);
  });
  it("returns the first items for an empty query and respects the limit", () => {
    expect(matchBranches("", list, 2).map((b) => b.id)).toEqual(["1", "2"]);
  });
});
