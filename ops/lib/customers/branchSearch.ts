export type BranchOption = { id: string; customer: string; name: string };

export function normalizeAr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[آأإا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, " ")
    .trim();
}

export function matchBranches(q: string, list: BranchOption[], limit = 8): BranchOption[] {
  const tokens = normalizeAr(q).split(" ").filter(Boolean);
  if (tokens.length === 0) return list.slice(0, limit);
  return list
    .filter((b) => {
      const hay = normalizeAr(`${b.customer} ${b.name}`);
      return tokens.every((t) => hay.includes(t));
    })
    .slice(0, limit);
}
