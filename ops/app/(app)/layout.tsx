import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { AppHeader } from "@/components/shell/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/account/password");
  const { t, locale } = await getT();
  return (
    <>
      <AppHeader user={user} t={t} locale={locale} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </>
  );
}
