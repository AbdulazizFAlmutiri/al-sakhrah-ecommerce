import { PageHeader, Badge } from "@/components/ui";
import { AdminForm, Field, fieldCls } from "@/components/AdminUI";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { getDepartments } from "@/lib/data";
import { getLang, makeT, pick, type DictKey } from "@/lib/i18n";
import { createUser, updateUser } from "@/app/admin-actions";

type Profile = { user_id: string; full_name: string; username: string; role: "admin" | "manager" | "inspector"; department: string | null; active: boolean };

export default async function UsersPage() {
  const me = await requireAdmin();
  const lang = await getLang();
  const t = makeT(lang);
  const ar = lang === "ar";
  const s = await createClient();
  const [{ data }, depts] = await Promise.all([s.from("profiles").select("*").order("created_at"), getDepartments()]);
  const users = (data ?? []) as Profile[];
  const roles = ["admin", "manager", "inspector"] as const;
  const deptSelect = (v?: string | null) => (
    <select name="department" defaultValue={v ?? ""} className={fieldCls}>
      <option value="">—</option>
      {depts.map((d) => <option key={d.code} value={d.code}>{d.code} · {pick(d, "name", lang)}</option>)}
    </select>
  );
  const roleSelect = (v?: string) => (
    <select name="role" defaultValue={v ?? "manager"} className={fieldCls}>
      {roles.map((r) => <option key={r} value={r}>{t(`role_${r}` as DictKey)}</option>)}
    </select>
  );

  return (
    <>
      <PageHeader title={t("users")} image="/images/automation.jpg" subtitle={ar ? "حسابات الموظفين وصلاحياتهم" : "Staff accounts and permissions"} />
      <div className="mb-5">
        <AdminForm action={createUser} summary={ar ? "إضافة مستخدم" : "Add a user"} saveLabel={t("save")} savedLabel={t("saved")}>
          <Field label={ar ? "الاسم *" : "Name *"}><input name="full_name" required className={fieldCls} /></Field>
          <Field label={ar ? "اسم المستخدم أو البريد *" : "Username or email *"}><input name="username" required placeholder="qc@alsakhrah.com" className={fieldCls} dir="ltr" /></Field>
          <Field label={ar ? "كلمة المرور (8 أحرف على الأقل) *" : "Password (8+ characters) *"}><input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldCls} dir="ltr" /></Field>
          <Field label={ar ? "الصلاحية" : "Role"}>{roleSelect()}</Field>
          <Field label={t("department")}>{deptSelect()}</Field>
        </AdminForm>
      </div>
      <div className="mb-4 grid gap-2 text-sm text-ink/65 sm:grid-cols-3">
        <p><b className="text-brand-900">{t("role_admin")}:</b> {ar ? "كل الصلاحيات." : "Full access."}</p>
        <p><b className="text-brand-900">{t("role_manager")}:</b> {ar ? "عرض كل شيء وكتابة ملاحظات المقيّم." : "Views everything, writes assessor notes."}</p>
        <p><b className="text-brand-900">{t("role_inspector")}:</b> {ar ? "عرض كل شيء وكتابة ملاحظات التفتيش." : "Views everything, writes inspection notes."}</p>
      </div>
      <ul className="divide-y divide-ink/10 border border-ink/10 bg-white">
        {users.map((u) => (
          <li key={u.user_id} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="min-w-0 flex-1 font-semibold text-brand-900">{u.full_name} {u.user_id === me.id && <span className="text-xs text-ink/50">({ar ? "أنت" : "you"})</span>}</p>
              <span className="text-sm text-ink/60" dir="ltr">{u.username}</span>
              <Badge tone="brand">{t(`role_${u.role}` as DictKey)}</Badge>
              {u.department && <span className="text-sm text-ink/60">{u.department}</span>}
              <Badge tone={u.active ? "ok" : "bad"}>{u.active ? t("active") : t("inactive")}</Badge>
            </div>
            <div className="mt-2">
              <AdminForm action={updateUser} summary={t("edit")} saveLabel={t("save")} savedLabel={t("saved")} resetOnSave={false}>
                <input type="hidden" name="user_id" value={u.user_id} />
                <Field label={ar ? "الاسم" : "Name"}><input name="full_name" defaultValue={u.full_name} className={fieldCls} /></Field>
                <Field label={ar ? "الصلاحية" : "Role"}>{roleSelect(u.role)}</Field>
                <Field label={t("department")}>{deptSelect(u.department)}</Field>
                <Field label={ar ? "كلمة مرور جديدة (اختياري)" : "New password (optional)"}><input name="password" type="password" minLength={8} autoComplete="new-password" className={fieldCls} dir="ltr" /></Field>
                <label className="flex items-center gap-2 text-sm font-semibold text-brand-900"><input type="checkbox" name="active" defaultChecked={u.active} /> {ar ? "الحساب مفعّل" : "Account active"}</label>
              </AdminForm>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
