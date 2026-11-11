"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { dbErrorKey } from "@/lib/db/errors";
import { isLocale, type MessageKey } from "@/lib/i18n";
import { ROLES, type Role } from "@/lib/orders/status";

export type ActionState = { ok?: boolean; error?: MessageKey };

function asRole(v: FormDataEntryValue | null): Role | null {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v) ? (v as Role) : null;
}

export async function createUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const role = asRole(fd.get("role"));
  const locale = fd.get("locale");
  if (!role || !isLocale(locale)) return { error: "common.error_generic" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_user", {
    p_username: String(fd.get("username") ?? ""),
    p_full_name: String(fd.get("full_name") ?? ""),
    p_role: role,
    p_locale: locale,
    p_password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const role = asRole(fd.get("role"));
  const locale = fd.get("locale");
  if (!role || !isLocale(locale)) return { error: "common.error_generic" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_user", {
    p_user_id: String(fd.get("user_id")),
    p_full_name: String(fd.get("full_name") ?? ""),
    p_role: role,
    p_locale: locale,
    p_active: fd.get("active") === "on",
  });
  if (error) return { error: dbErrorKey(error.message) };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetPasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reset_password", {
    p_user_id: String(fd.get("user_id")),
    p_password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: dbErrorKey(error.message) };
  return { ok: true };
}
