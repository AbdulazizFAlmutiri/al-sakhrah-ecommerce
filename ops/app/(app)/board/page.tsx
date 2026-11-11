import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";

export default async function BoardPage() {
  const user = await requireRole(["admin", "sales"]);
  const { t } = await getT();
  return (
    <Card title={t("home.welcome", { name: user.fullName })} eyebrow="Dispatch">
      <p className="text-ink-500">{t("home.board_intro")}</p>
    </Card>
  );
}
