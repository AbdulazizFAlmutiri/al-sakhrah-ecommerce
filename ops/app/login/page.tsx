import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/roles";
import { getT } from "@/lib/i18n/server";
import { LOCALES } from "@/lib/i18n";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/account/password" : homeFor(user.role));
  const { locale, t } = await getT();
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="corner-accent hidden flex-col justify-between bg-navy-700 p-10 text-white md:flex">
        <span className="eyebrow text-royal-100">Al-Sakhra for Industry</span>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">{t("app.name")}</h1>
          <div className="mt-4 h-1 w-16 bg-royal-500" />
        </div>
        <span className="eyebrow text-royal-100">Al-Kharj · Riyadh</span>
      </section>
      <section className="flex flex-col items-center justify-center gap-8 p-6">
        <Logo className="w-40" />
        <div className="w-full max-w-sm border-t-4 border-royal-600 bg-white p-6 shadow-sm">
          <span className="eyebrow text-royal-600">{t("login.eyebrow")}</span>
          <h2 className="mb-6 mt-1 text-2xl font-bold text-navy-700">{t("login.title")}</h2>
          <LoginForm
            labels={{
              username: t("login.username"),
              password: t("login.password"),
              submit: t("login.submit"),
              errors: {
                "login.error_invalid": t("login.error_invalid"),
                "login.error_locked": t("login.error_locked"),
                "login.error_inactive": t("login.error_inactive"),
              },
            }}
          />
        </div>
        <LocaleSwitcher
          current={locale}
          labels={Object.fromEntries(LOCALES.map((l) => [l, t(`locale.${l}` as const)])) as Record<(typeof LOCALES)[number], string>}
        />
      </section>
    </main>
  );
}
