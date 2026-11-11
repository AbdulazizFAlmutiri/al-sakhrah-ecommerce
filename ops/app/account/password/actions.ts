"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireUser } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/roles";
import type { MessageKey } from "@/lib/i18n";

export type PasswordState = { error?: MessageKey };

export async function changePasswordAction(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const pw = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (pw.length < 8) return { error: "password.error_short" };
  if (pw !== confirm) return { error: "password.error_mismatch" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) return { error: "common.error_generic" };
  await supabase.rpc("clear_must_change_password");
  redirect(homeFor(user.role));
}
