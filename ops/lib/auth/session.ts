import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { homeFor } from "@/lib/auth/roles";
import type { Locale } from "@/lib/i18n";
import type { Role } from "@/lib/orders/status";

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  locale: Locale;
  mustChangePassword: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: p } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, role, locale, active, must_change_password")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!p || !p.active) return null;
  return {
    id: p.user_id,
    username: p.username,
    fullName: p.full_name,
    role: p.role,
    locale: p.locale,
    mustChangePassword: p.must_change_password,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/account/password");
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
