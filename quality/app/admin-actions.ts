"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireAdmin, requireUser, audit, type Role } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/db/admin";
import { toLoginEmail } from "@/lib/auth/username";

export type ActionResult = { ok?: boolean; error?: string };
const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return v === null ? null : String(v).trim() || null;
};
const done = (): ActionResult => {
  revalidatePath("/dashboard", "layout");
  return { ok: true };
};

// ---------------------------------------------------------------- uploads
/** Gives the browser a one-time link to upload a PDF straight to private storage. */
export async function getUploadUrl(folder: string, filename: string) {
  await requireAdmin();
  const safe = filename.replace(/[^\w.\-]+/g, "_").slice(-80) || "file.pdf";
  const path = `${folder.replace(/[^\w-]/g, "")}/${randomUUID()}-${safe}`;
  const { data, error } = await createAdminClient().storage.from("files").createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "upload");
  return { path, token: data.token };
}

// ---------------------------------------------------------------- documents
export async function saveDocument(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = s(fd, "id");
  const row = {
    code: s(fd, "code"), title_ar: s(fd, "title_ar"), title_en: s(fd, "title_en"),
    doc_type: s(fd, "doc_type") ?? "sop", department: s(fd, "department"), version: s(fd, "version") ?? "1.0",
    status: s(fd, "status") ?? "active", prepared_at: s(fd, "prepared_at"), reviewed_at: s(fd, "reviewed_at"),
    approved_at: s(fd, "approved_at"), issued_at: s(fd, "issued_at"), effective_at: s(fd, "effective_at"),
    implementation_start_at: s(fd, "implementation_start_at"), sort: Number(s(fd, "sort") ?? 100),
    ...(s(fd, "file_ar") ? { file_ar: s(fd, "file_ar") } : {}),
    ...(s(fd, "file_en") ? { file_en: s(fd, "file_en") } : {}),
    updated_at: new Date().toISOString(),
  };
  if (!row.code || !row.title_ar || !row.department) return { error: "missing" };
  const db = createAdminClient();
  const { data, error } = id
    ? await db.from("documents").update(row).eq("id", id).select("id").single()
    : await db.from("documents").insert(row).select("id").single();
  if (error) return { error: error.message };
  await audit(user, id ? "update" : "create", "document", data.id, { code: row.code });
  return done();
}

export async function deleteDocument(id: string) {
  const user = await requireAdmin();
  await createAdminClient().from("documents").delete().eq("id", id);
  await audit(user, "delete", "document", id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/documents");
}

// ---------------------------------------------------------------- forms
export async function saveForm(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = s(fd, "id");
  const row = {
    code: s(fd, "code"), title_ar: s(fd, "title_ar"), title_en: s(fd, "title_en"), document_id: s(fd, "document_id"),
    sort: Number(s(fd, "sort") ?? 100), ...(s(fd, "file") ? { file: s(fd, "file") } : {}),
  };
  if (!row.code || !row.title_ar || !row.document_id) return { error: "missing" };
  const db = createAdminClient();
  const { data, error } = id ? await db.from("forms").update(row).eq("id", id).select("id").single() : await db.from("forms").insert(row).select("id").single();
  if (error) return { error: error.message };
  await audit(user, id ? "update" : "create", "form", data.id, { code: row.code });
  return done();
}

export async function deleteForm(id: string) {
  const user = await requireAdmin();
  await createAdminClient().from("forms").delete().eq("id", id);
  await audit(user, "delete", "form", id);
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------- distributed copies
export async function issueCopy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const documentId = s(fd, "document_id");
  const departments = fd.getAll("departments").map(String).filter(Boolean);
  if (!documentId || departments.length === 0) return { error: "missing" };
  const db = createAdminClient();
  const { data: last } = await db.from("distributed_copies").select("copy_number").eq("document_id", documentId).order("copy_number", { ascending: false }).limit(1);
  let n = last?.[0]?.copy_number ?? 0;
  const rows = departments.map((department) => ({ document_id: documentId, department, copy_number: ++n, issued_at: s(fd, "issued_at") ?? undefined }));
  const { error } = await db.from("distributed_copies").insert(rows);
  if (error) return { error: error.message };
  await audit(user, "issue", "copy", documentId, { departments });
  return done();
}

export async function withdrawCopy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = s(fd, "id");
  if (!id) return { error: "missing" };
  const { error } = await createAdminClient()
    .from("distributed_copies")
    .update({ status: "cancelled", withdrawn_at: s(fd, "withdrawn_at") ?? new Date().toISOString().slice(0, 10), withdraw_reason: s(fd, "reason") })
    .eq("id", id);
  if (error) return { error: error.message };
  await audit(user, "withdraw", "copy", id, { reason: s(fd, "reason") });
  return done();
}

// ---------------------------------------------------------------- papers (official, calibration, contracts)
export async function savePaper(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const id = s(fd, "id");
  const row = { category: s(fd, "category"), title_ar: s(fd, "title_ar"), title_en: s(fd, "title_en"), sort: Number(s(fd, "sort") ?? 100), ...(s(fd, "file") ? { file: s(fd, "file") } : {}) };
  if (!row.category || !row.title_ar) return { error: "missing" };
  const db = createAdminClient();
  const { data, error } = id ? await db.from("papers").update(row).eq("id", id).select("id").single() : await db.from("papers").insert(row).select("id").single();
  if (error) return { error: error.message };
  await audit(user, id ? "update" : "create", "paper", data.id, { title: row.title_ar });
  return done();
}

export async function deletePaper(id: string) {
  const user = await requireAdmin();
  await createAdminClient().from("papers").delete().eq("id", id);
  await audit(user, "delete", "paper", id);
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------- self-assessment
export async function saveClause(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const number = Number(s(fd, "number"));
  const row = { number, text_ar: s(fd, "text_ar"), text_en: s(fd, "text_en"), reference: s(fd, "reference"), severity: s(fd, "severity") ?? "minor", updated_at: new Date().toISOString(), updated_by: user.id };
  if (!number || !row.text_ar) return { error: "missing" };
  const { error } = await createAdminClient().from("clauses").upsert(row);
  if (error) return { error: error.message };
  await audit(user, "save", "clause", String(number));
  return done();
}

/** Assessor notes: admins and department managers. Inspection notes: admins and inspectors. */
export async function saveClauseNote(number: number, field: "assessor_notes" | "inspection_notes", value: string): Promise<ActionResult> {
  const user = await requireUser();
  const allowed: Record<typeof field, Role[]> = { assessor_notes: ["admin", "manager"], inspection_notes: ["admin", "inspector"] };
  if (!allowed[field].includes(user.role)) return { error: "forbidden" };
  const { error } = await createAdminClient().from("clauses").update({ [field]: value || null, updated_at: new Date().toISOString(), updated_by: user.id }).eq("number", number);
  if (error) return { error: error.message };
  await audit(user, "note", "clause", String(number), { field });
  revalidatePath(`/dashboard/clauses/${number}`);
  return { ok: true };
}

export async function addEvidence(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const clause_number = Number(s(fd, "clause_number"));
  const target = s(fd, "target"); // "document:ID" | "form:ID" | "paper:ID"
  const file = s(fd, "file");
  const row: Record<string, unknown> = { clause_number, label: s(fd, "label") };
  if (file) row.file = file;
  else if (target) {
    const [kind, id] = target.split(":");
    row[`${kind}_id`] = id;
  } else return { error: "missing" };
  const { error } = await createAdminClient().from("clause_evidence").insert(row);
  if (error) return { error: error.message };
  await audit(user, "add", "evidence", String(clause_number));
  return done();
}

export async function removeEvidence(id: string) {
  const user = await requireAdmin();
  await createAdminClient().from("clause_evidence").delete().eq("id", id);
  await audit(user, "delete", "evidence", id);
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------- users
export async function createUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const email = toLoginEmail(s(fd, "username") ?? "");
  const password = s(fd, "password");
  const full_name = s(fd, "full_name");
  if (!email || !password || password.length < 8 || !full_name) return { error: "missing" };
  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return { error: error?.message ?? "error" };
  const { error: pe } = await db.from("profiles").insert({ user_id: data.user.id, full_name, username: email, role: s(fd, "role") ?? "manager", department: s(fd, "department") });
  if (pe) return { error: pe.message };
  await audit(user, "create", "user", data.user.id, { email });
  return done();
}

export async function updateUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = s(fd, "user_id");
  if (!id) return { error: "missing" };
  if (id === admin.id && fd.get("active") !== "on") return { error: "self" }; // never lock yourself out
  const db = createAdminClient();
  const { error } = await db.from("profiles").update({ full_name: s(fd, "full_name"), role: s(fd, "role"), department: s(fd, "department"), active: fd.get("active") === "on" }).eq("user_id", id);
  if (error) return { error: error.message };
  const password = s(fd, "password");
  if (password) {
    if (password.length < 8) return { error: "password" };
    const { error: e2 } = await db.auth.admin.updateUserById(id, { password });
    if (e2) return { error: e2.message };
  }
  await audit(admin, "update", "user", id, { passwordChanged: Boolean(password) });
  return done();
}
