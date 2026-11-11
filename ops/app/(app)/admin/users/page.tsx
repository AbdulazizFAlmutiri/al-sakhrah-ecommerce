import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getT } from "@/lib/i18n/server";
import { LOCALES } from "@/lib/i18n";
import { ROLES } from "@/lib/orders/status";
import { Card } from "@/components/ui/Card";
import { CreateUserForm, type UserFormLabels } from "./CreateUserForm";
import { UserRow } from "./UserRow";

export default async function UsersPage() {
  await requireRole(["admin"]);
  const { t } = await getT();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, role, locale, active")
    .order("role")
    .order("username");

  const labels: UserFormLabels = {
    username: t("users.username"), fullName: t("users.full_name"), role: t("users.role"),
    locale: t("users.locale"), password: t("users.temp_password"), submit: t("users.create"), created: t("users.created"),
    roles: Object.fromEntries(ROLES.map((r) => [r, t(`role.${r}` as const)])),
    locales: Object.fromEntries(LOCALES.map((l) => [l, t(`locale.${l}` as const)])),
    errors: {
      "users.error_taken": t("users.error_taken"),
      "users.error_invalid_username": t("users.error_invalid_username"),
      "users.error_weak_password": t("users.error_weak_password"),
      "users.error_self": t("users.error_self"),
      "common.not_authorized": t("common.not_authorized"),
      "common.error_generic": t("common.error_generic"),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title={t("users.create")} eyebrow={t("users.eyebrow")}>
        <CreateUserForm labels={labels} />
      </Card>
      <Card title={t("users.title")}>
        <ul>
          {(users ?? []).map((u) => (
            <UserRow
              key={u.user_id}
              u={u}
              labels={{ ...labels, save: t("common.save"), active: t("common.active"), reset: t("users.reset_password"),
                resetDone: t("users.password_reset_done"), saved: t("common.saved") }}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}
