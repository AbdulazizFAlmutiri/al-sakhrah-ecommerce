import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { createAdminClient } from "@/lib/db/admin";

export type Role = "admin" | "manager" | "inspector";
export type CurrentUser = { id: string; username: string; fullName: string; role: Role; department: string | null };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: p } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, role, department, active")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!p || !p.active) return null;
  return { id: p.user_id, username: p.username, fullName: p.full_name, role: p.role, department: p.department };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Only admins can add, edit or delete records and manage users. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export async function audit(user: CurrentUser, action: string, entity: string, entityId?: string, details?: unknown) {
  await createAdminClient().from("audit_log").insert({
    user_id: user.id,
    action,
    entity,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
}
