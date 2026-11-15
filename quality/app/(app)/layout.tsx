import { Sidebar, type NavItem } from "@/components/Sidebar";
import { PdfViewerProvider } from "@/components/PdfViewer";
import { requireUser } from "@/lib/auth/session";
import { getLang, makeT } from "@/lib/i18n";
import { countClauses } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  const clauseCount = await countClauses();

  const items: NavItem[] = [
    { key: "home", href: "/dashboard", label: t("home") },
    { key: "general", href: "/dashboard/general", label: t("general") },
    { key: "sopIndex", href: "/dashboard/sop-index", label: t("sopIndex") },
    { key: "documents", href: "/dashboard/documents", label: t("documents") },
    { key: "docControl", href: "/dashboard/doc-control", label: t("docControl") },
    { key: "distribution", href: "/dashboard/distribution", label: t("distribution") },
    { key: "clauses", href: "/dashboard/clauses", label: t("clauses"), badge: clauseCount ? String(clauseCount) : undefined },
    { key: "calibration", href: "/dashboard/calibration", label: t("calibration") },
    { key: "contracts", href: "/dashboard/contracts", label: t("contracts") },
    ...(user.role === "admin"
      ? ([
          { key: "users", href: "/dashboard/users", label: t("users") },
          { key: "audit", href: "/dashboard/audit", label: t("audit") },
        ] as NavItem[])
      : []),
  ];

  return (
    <PdfViewerProvider labels={{ print: t("print"), close: t("close") }}>
      <Sidebar
        items={items}
        lang={lang}
        user={{ name: user.fullName, role: t(`role_${user.role}`) }}
        labels={{ appName: t("appName"), company: t("company"), logout: t("logout"), switchLang: t("switchLang") }}
      />
      <main className="min-h-dvh px-4 py-6 sm:px-6 lg:ms-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </PdfViewerProvider>
  );
}
