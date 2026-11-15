import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/db/server";

// All reads go through the signed-in user's client, so row level security applies.

export type Department = { code: string; name_ar: string; name_en: string; sort: number; holds_copies: boolean };
export type Doc = {
  id: string; code: string; title_ar: string; title_en: string | null; doc_type: "sop" | "manual"; department: string;
  version: string; status: "active" | "obsolete"; prepared_at: string | null; reviewed_at: string | null; approved_at: string | null;
  issued_at: string | null; effective_at: string | null; implementation_start_at: string | null; next_review_at: string | null;
  file_ar: string | null; file_en: string | null; sort: number;
};
export type Form = { id: string; code: string; title_ar: string; title_en: string | null; document_id: string; file: string | null; sort: number };
export type Copy = { id: string; document_id: string; copy_number: number; department: string; status: "distributed" | "cancelled"; issued_at: string; withdrawn_at: string | null; withdraw_reason: string | null };
export type Clause = { number: number; text_ar: string; text_en: string | null; reference: string | null; severity: "minor" | "major"; assessor_notes: string | null; inspection_notes: string | null; updated_at: string };
export type Paper = { id: string; category: "general" | "calibration" | "contract"; title_ar: string; title_en: string | null; file: string | null; sort: number };
export type Evidence = { id: string; clause_number: number; document_id: string | null; form_id: string | null; paper_id: string | null; label: string | null; file: string | null };

export const getDepartments = cache(async (): Promise<Department[]> => {
  const s = await createClient();
  const { data } = await s.from("departments").select("*").order("sort");
  return data ?? [];
});

export const getDocuments = cache(async (): Promise<Doc[]> => {
  const s = await createClient();
  const { data } = await s.from("documents").select("*").order("doc_type", { ascending: false }).order("department").order("sort").order("code");
  return data ?? [];
});

export const getForms = cache(async (): Promise<Form[]> => {
  const s = await createClient();
  const { data } = await s.from("forms").select("*").order("sort").order("code");
  return data ?? [];
});

export const getCopies = cache(async (): Promise<Copy[]> => {
  const s = await createClient();
  const { data } = await s.from("distributed_copies").select("*").order("copy_number");
  return data ?? [];
});

export const getClauses = cache(async (): Promise<Clause[]> => {
  const s = await createClient();
  const { data } = await s.from("clauses").select("*").order("number");
  return data ?? [];
});

export const countClauses = cache(async (): Promise<number> => {
  const s = await createClient();
  const { count } = await s.from("clauses").select("number", { count: "exact", head: true });
  return count ?? 0;
});

export const getPapers = cache(async (category: Paper["category"]): Promise<Paper[]> => {
  const s = await createClient();
  const { data } = await s.from("papers").select("*").eq("category", category).order("sort").order("created_at");
  return data ?? [];
});

export const getEvidence = cache(async (): Promise<Evidence[]> => {
  const s = await createClient();
  const { data } = await s.from("clause_evidence").select("*").order("created_at");
  return data ?? [];
});

/** Simple, accent-insensitive match on any of the given strings. */
export function matches(q: string, ...fields: (string | null | undefined)[]): boolean {
  if (!q) return true;
  const n = (v: string) => v.toLowerCase().replace(/[ًٌٍَُِّْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
  const needle = n(q.trim());
  return fields.some((f) => f && n(f).includes(needle));
}

export function fileUrl(path: string | null | undefined): string | null {
  return path ? `/api/files?path=${encodeURIComponent(path)}` : null;
}

export function reviewState(doc: Doc): "ok" | "soon" | "due" | "unknown" {
  if (!doc.next_review_at) return "unknown";
  const days = (new Date(doc.next_review_at).getTime() - Date.now()) / 86400000;
  return days < 0 ? "due" : days < 60 ? "soon" : "ok";
}
