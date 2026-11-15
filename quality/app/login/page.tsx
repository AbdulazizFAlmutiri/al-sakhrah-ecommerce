import { redirect } from "next/navigation";
import { ClipboardCheck, FileCheck2, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO } from "@/lib/demo";
import { getLang, makeT } from "@/lib/i18n";
import { LoginForm } from "./LoginForm";
import { LangToggle } from "@/components/LangToggle";
import { Eyebrow, TintedPhoto } from "@/components/ui";

export default async function LoginPage() {
  if (!DEMO && (await getCurrentUser())) redirect("/dashboard");
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const points = [
    { icon: FileCheck2, text: ar ? "إجراءات العمل المعتمدة ونماذجها" : "Approved procedures and their forms" },
    { icon: ShieldCheck, text: ar ? "ضبط الوثائق والنسخ الموزعة" : "Document control and issued copies" },
    { icon: ClipboardCheck, text: ar ? "التقييم الذاتي وأدلة الالتزام" : "Self-assessment and compliance evidence" },
  ];
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex xl:p-16">
        <TintedPhoto src="/images/lab.jpg" className="-z-10 opacity-60" />
        <div className="pattern-lines absolute inset-0 -z-10" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark-white.png" alt="" aria-hidden className="pointer-events-none absolute -bottom-24 -end-24 -z-10 w-[520px] max-w-none opacity-[0.07]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt={t("company")} className="rise h-36 w-auto self-start" />
        <div className="rise-2">
          <Eyebrow light>{t("company")}</Eyebrow>
          <h1 className="mt-4 text-5xl font-bold leading-tight">{t("appName")}</h1>
          <ul className="mt-8 grid gap-4">
            {points.map((p) => (
              <li key={p.text} className="flex items-center gap-4 text-lg text-white/85">
                <span className="grid h-11 w-11 shrink-0 place-items-center bg-white/10 text-brand-200"><p.icon size={22} strokeWidth={1.75} /></span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs font-semibold tracking-[0.15em] text-white/50" dir="ltr">AL-SAKHRA FOR INDUSTRY · ISO 9001 · SFDA</p>
      </section>

      <section className="relative flex flex-col justify-center bg-surface px-6 py-12 sm:px-12">
        <div className="rise-3 mx-auto w-full max-w-md bg-white p-8 shadow-xl shadow-brand-900/5 ring-1 ring-ink/5 sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-color.png" alt="" className="h-14 w-auto lg:hidden" />
            <LangToggle lang={lang} label={t("switchLang")} className="ms-auto text-sm font-semibold text-brand-700 hover:underline" />
          </div>
          <Eyebrow>{t("appName")}</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-brand-900">{t("loginTitle")}</h2>
          <p className="mt-2 text-ink/60">{ar ? "للموظفين المصرّح لهم فقط." : "Authorised staff only."}</p>
          <div className="mt-8">
            <LoginForm labels={{ username: t("username"), password: t("password"), signIn: t("signIn"), loginError: t("loginError") }} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-ink/45">© {new Date().getFullYear()} {t("company")}</p>
      </section>
    </main>
  );
}
