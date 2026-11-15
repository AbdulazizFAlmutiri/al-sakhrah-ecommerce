import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLang, makeT } from "@/lib/i18n";
import { LoginForm } from "./LoginForm";
import { LangToggle } from "@/components/LangToggle";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const lang = await getLang();
  const t = makeT(lang);
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-brand-950 p-12 text-white lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt={t("company")} className="h-40 w-auto self-start" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-200">{t("company")}</p>
          <h1 className="mt-3 text-4xl font-bold">{t("appName")}</h1>
        </div>
      </section>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-color.png" alt="" className="h-14 w-auto lg:hidden" />
            <LangToggle lang={lang} label={t("switchLang")} className="ms-auto text-sm font-semibold text-brand-700" />
          </div>
          <h2 className="text-3xl font-bold text-brand-900">{t("loginTitle")}</h2>
          <p className="mt-2 text-ink/60">{t("appName")}{lang === "ar" ? "، " : ", "}{t("company")}</p>
          <div className="mt-8">
            <LoginForm labels={{ username: t("username"), password: t("password"), signIn: t("signIn"), loginError: t("loginError") }} />
          </div>
        </div>
      </section>
    </main>
  );
}
