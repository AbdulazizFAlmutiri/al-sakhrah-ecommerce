import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";

export default async function WarehousePage() {
  const user = await requireRole(["admin", "warehouse"]);
  const { t } = await getT();
  return (
    <Card title={t("home.welcome", { name: user.fullName })} eyebrow="Warehouse">
      <p className="text-ink-500">{t("home.warehouse_intro")}</p>
    </Card>
  );
}
