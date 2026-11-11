import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { getFormOptions } from "@/lib/orders/queries";
import { riyadhToday } from "@/lib/time";
import { Card } from "@/components/ui/Card";
import { OrderForm } from "./OrderForm";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  await requireRole(["admin", "sales"]);
  const { branch } = await searchParams;
  const { t } = await getT();
  const { branches, reps, drivers } = await getFormOptions();
  return (
    <Card title={t("order.title")} eyebrow="New order" className="mx-auto max-w-3xl">
      <OrderForm
        branches={branches} reps={reps} drivers={drivers} today={riyadhToday()} initialBranch={branch}
        labels={{
          branch: t("order.branch"), search: t("order.branch_search"), missing: t("order.branch_missing"), addBranch: t("order.add_branch"),
          rep: t("order.rep"), po: t("order.po"), driver: t("order.driver"), external: t("board.external"), date: t("order.date"),
          notes: t("order.notes"), save: t("order.save"), another: t("order.save_another"), saved: t("order.saved"), choose: t("order.choose"),
          errors: {
            "order.error_branch": t("order.error_branch"), "order.error_required": t("order.error_required"),
            "order.error_driver": t("order.error_driver"), "common.error_generic": t("common.error_generic"),
            "common.not_authorized": t("common.not_authorized"),
          },
        }}
      />
    </Card>
  );
}
