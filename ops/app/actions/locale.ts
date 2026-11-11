"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

export async function setLocaleAction(fd: FormData): Promise<void> {
  const locale = fd.get("locale");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  if (await getCurrentUser()) {
    const supabase = await createClient();
    await supabase.rpc("set_my_locale", { p_locale: locale });
  }
  revalidatePath("/", "layout");
}
