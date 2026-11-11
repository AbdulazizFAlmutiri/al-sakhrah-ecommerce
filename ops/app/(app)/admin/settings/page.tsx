import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";
import { RepsSection } from "./RepsSection";
import { ReasonsSection } from "./ReasonsSection";
import { WarehouseSection } from "./WarehouseSection";

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const { t } = await getT();
  const supabase = await createClient();
  const [{ data: reps }, { data: reasons }, { data: warehouses }] = await Promise.all([
    supabase.from("sales_reps").select("id, name, active").order("name"),
    supabase.from("failure_reasons").select("id, code, label_ar, label_en, label_ur, icon, sort, active").order("sort"),
    supabase.from("warehouses").select("id, name, lat, lng").order("created_at").limit(1),
  ]);
  const errors = {
    "common.error_generic": t("common.error_generic"),
    "common.not_authorized": t("common.not_authorized"),
    "settings.error_rep_taken": t("settings.error_rep_taken"),
    "settings.error_maps_link": t("settings.error_maps_link"),
  };
  const w = warehouses?.[0];
  return (
    <div className="flex flex-col gap-6">
      {w && (
        <Card title={t("settings.warehouse")} eyebrow="Depot">
          <WarehouseSection
            w={w}
            labels={{
              name: t("settings.warehouse_name"), link: t("settings.maps_link"), save: t("common.save"), saved: t("common.saved"),
              location: w.lat != null && w.lng != null ? t("settings.location_set", { lat: w.lat.toFixed(5), lng: w.lng.toFixed(5) }) : t("settings.location_missing"),
              errors,
            }}
          />
        </Card>
      )}
      <Card title={t("settings.reps")} eyebrow="Sales reps">
        <RepsSection reps={reps ?? []} labels={{ name: t("settings.rep_name"), add: t("common.add"), active: t("common.active"), inactive: t("common.inactive"), errors }} />
      </Card>
      <Card title={t("settings.reasons")} eyebrow="Delivery">
        <ReasonsSection
          reasons={reasons ?? []}
          labels={{ code: t("settings.reason_code"), ar: t("settings.reason_label_ar"), en: t("settings.reason_label_en"), ur: t("settings.reason_label_ur"),
            icon: t("settings.reason_icon"), sort: t("settings.reason_sort"), active: t("common.active"), save: t("common.save"),
            add: t("common.add"), saved: t("common.saved"), errors }}
        />
      </Card>
    </div>
  );
}
