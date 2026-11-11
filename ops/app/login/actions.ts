"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { homeFor } from "@/lib/auth/roles";
import { isValidUsername, normalizeUsername, toAuthEmail } from "@/lib/auth/username";
import type { MessageKey } from "@/lib/i18n";

export type LoginState = { error?: MessageKey };

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const username = normalizeUsername(String(fd.get("username") ?? ""));
  const password = String(fd.get("password") ?? "");
  if (!isValidUsername(username) || password.length === 0) return { error: "login.error_invalid" };

  const supabase = await createClient();
  const { data: locked } = await supabase.rpc("login_is_locked", { p_username: username });
  if (locked) return { error: "login.error_locked" };

  const { data, error } = await supabase.auth.signInWithPassword({ email: toAuthEmail(username), password });
  if (error || !data.user) {
    await supabase.rpc("record_login_attempt", { p_username: username, p_success: false });
    return { error: error?.message?.toLowerCase().includes("banned") ? "login.error_inactive" : "login.error_invalid" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active, must_change_password")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    return { error: "login.error_inactive" };
  }
  await supabase.rpc("record_login_attempt", { p_username: username, p_success: true });
  redirect(profile.must_change_password ? "/account/password" : homeFor(profile.role));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
