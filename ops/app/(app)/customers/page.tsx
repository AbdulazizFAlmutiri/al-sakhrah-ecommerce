import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { AddBranchForm, AddCustomerForm } from "./CustomerForms";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ return?: string }> }) {
  await requireRole(["admin", "sales"]);
  const { return: returnTo } = await searchParams;
  const { t } = await getT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, branches(id, name, phone, lat, lng)")
    .order("name");
  const customers = (data ?? []) as { id: string; name: string; branches: { id: string; name: string; phone: string | null; lat: number; lng: number }[] }[];
  const labels = {
    customerName: t("customers.customer_name"), addCustomer: t("customers.add_customer"), customer: t("customers.customer"),
    branchName: t("customers.branch_name"), phone: t("customers.phone"), location: t("customers.location"),
    addBranch: t("customers.add_branch"), saved: t("customers.saved"), choose: t("order.choose"),
    errors: {
      "order.error_required": t("order.error_required"), "customers.error_taken": t("customers.error_taken"),
      "settings.error_maps_link": t("settings.error_maps_link"), "common.error_generic": t("common.error_generic"),
      "common.not_authorized": t("common.not_authorized"),
    },
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("customers.add_branch")} eyebrow="Branch">
          <AddBranchForm customers={customers.map(({ id, name }) => ({ id, name }))} labels={labels} returnTo={returnTo === "/board/new" ? returnTo : undefined} />
        </Card>
        <Card title={t("customers.add_customer")} eyebrow="Customer">
          <AddCustomerForm labels={labels} />
        </Card>
      </div>
      <Card title={t("customers.title")}>
        <ul className="divide-y divide-mist-200">
          {customers.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-navy-700">{c.name}</span>
                <span className="text-xs text-ink-500">{t("customers.branches_n", { n: c.branches.length })}</span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {c.branches.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 rounded-full border border-mist-200 bg-white px-3 py-1 text-sm">
                    {b.name}
                    <a className="text-royal-600" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${b.lat},${b.lng}`} aria-label={t("customers.map")}>
                      <Icon name="location_on" className="text-base" />
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
