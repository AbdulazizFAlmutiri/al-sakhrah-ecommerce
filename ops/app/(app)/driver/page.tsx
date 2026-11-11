import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";

export default async function DriverPage() {
  const user = await requireRole(["driver"]);
  const { t } = await getT();
  return (
    <Card title={t("home.welcome", { name: user.fullName })} eyebrow="Deliveries">
      <p className="text-lg text-ink-500">{t("home.driver_intro")}</p>
    </Card>
  );
}
