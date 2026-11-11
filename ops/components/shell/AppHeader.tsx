import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { logoutAction } from "@/app/login/actions";
import { NAV_BY_ROLE } from "@/lib/auth/roles";
import { LOCALES, type Locale, type T } from "@/lib/i18n";
import type { CurrentUser } from "@/lib/auth/session";

export function AppHeader({ user, t, locale }: { user: CurrentUser; t: T; locale: Locale }) {
  return (
    <header className="bg-navy-700 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl bg-white px-2 py-1">
          <Logo variant="mark" className="h-8 w-8" />
          <span className="text-sm font-bold text-navy-700">{t("app.name")}</span>
        </Link>
        <nav className="flex flex-1 flex-wrap gap-1">
          {NAV_BY_ROLE[user.role].map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-navy-800">
              <Icon name={item.icon} className="text-xl" />
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">
            {user.fullName} · <span className="text-royal-100">{t(`role.${user.role}` as const)}</span>
          </span>
          <div className="rounded-xl bg-white p-0.5">
            <LocaleSwitcher
              current={locale}
              labels={Object.fromEntries(LOCALES.map((l) => [l, t(`locale.${l}` as const)])) as Record<Locale, string>}
            />
          </div>
          <form action={logoutAction}>
            <button className="flex items-center gap-1 rounded-lg px-2 py-2 hover:bg-navy-800" aria-label={t("common.logout")}>
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </div>
      <div className="h-1 bg-royal-600" />
    </header>
  );
}
