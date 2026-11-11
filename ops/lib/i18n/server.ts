import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { DEFAULT_LOCALE, isLocale, makeT, type Locale, type T } from "@/lib/i18n";

export const LOCALE_COOKIE = "ops_locale";

export async function getLocale(): Promise<Locale> {
  const user = await getCurrentUser();
  if (user) return user.locale;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export async function getT(): Promise<{ locale: Locale; t: T }> {
  const locale = await getLocale();
  return { locale, t: makeT(locale) };
}
