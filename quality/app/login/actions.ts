"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { toLoginEmail } from "@/lib/auth/username";

export type LoginState = { error?: boolean };

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = toLoginEmail(String(fd.get("username") ?? ""));
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: true };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: true };

  const { data: profile } = await supabase.from("profiles").select("active").eq("user_id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { error: true };
  }
  redirect("/dashboard");
}
