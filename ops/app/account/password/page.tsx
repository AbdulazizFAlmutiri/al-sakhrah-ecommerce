import { requireUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Logo } from "@/components/brand/Logo";
import { PasswordForm } from "./PasswordForm";

export default async function PasswordPage() {
  await requireUser();
  const { t } = await getT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Logo variant="mark" className="w-16" />
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-lg ring-1 ring-mist-200/60">
        <h1 className="text-2xl font-bold text-navy-700">{t("password.title")}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-500">{t("password.hint")}</p>
        <PasswordForm
          labels={{
            new: t("password.new"),
            confirm: t("password.confirm"),
            submit: t("password.submit"),
            errors: {
              "password.error_short": t("password.error_short"),
              "password.error_mismatch": t("password.error_mismatch"),
              "common.error_generic": t("common.error_generic"),
            },
          }}
        />
      </div>
    </main>
  );
}
