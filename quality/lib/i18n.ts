import "server-only";
import { cookies } from "next/headers";

export type Lang = "ar" | "en";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  return c.get("lang")?.value === "en" ? "en" : "ar";
}

/** Pick the right language from a row that has `${field}_ar` / `${field}_en`. */
export function pick(row: Record<string, unknown> | null | undefined, field: string, lang: Lang): string {
  if (!row) return "";
  const en = row[`${field}_en`];
  const ar = row[`${field}_ar`];
  return String((lang === "en" && en ? en : ar) ?? en ?? "");
}

const dict = {
  appName: { ar: "نظام الجودة", en: "Quality system" },
  company: { ar: "مصنع الصخرة للصناعة", en: "AlSakhra Factory for Manufacturing" },
  // navigation
  home: { ar: "الرئيسية", en: "Overview" },
  general: { ar: "الأوراق الرسمية", en: "Official papers" },
  sopIndex: { ar: "فهرس الإجراءات", en: "Procedures index" },
  documents: { ar: "إجراءات العمل القياسية", en: "SOPs" },
  docControl: { ar: "ضبط الوثائق", en: "Document control" },
  distribution: { ar: "النسخ الموزعة", en: "Distributed copies" },
  clauses: { ar: "التقييم الذاتي", en: "Self-assessment" },
  calibration: { ar: "شهادات المعايرة", en: "Calibration certificates" },
  contracts: { ar: "العقود", en: "Contracts" },
  users: { ar: "المستخدمون", en: "Users" },
  audit: { ar: "سجل التغييرات", en: "Change log" },
  logout: { ar: "تسجيل الخروج", en: "Sign out" },
  switchLang: { ar: "English", en: "عربي" },
  // roles
  role_admin: { ar: "مدير النظام", en: "System admin" },
  role_manager: { ar: "مدير قسم", en: "Department manager" },
  role_inspector: { ar: "مفتش", en: "Inspector" },
  // common
  view: { ar: "عرض", en: "View" },
  print: { ar: "طباعة", en: "Print" },
  search: { ar: "بحث", en: "Search" },
  all: { ar: "الكل", en: "All" },
  save: { ar: "حفظ", en: "Save" },
  saved: { ar: "تم الحفظ", en: "Saved" },
  add: { ar: "إضافة", en: "Add" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  close: { ar: "إغلاق", en: "Close" },
  back: { ar: "رجوع", en: "Back" },
  code: { ar: "الكود", en: "Code" },
  title: { ar: "العنوان", en: "Title" },
  department: { ar: "القسم", en: "Department" },
  status: { ar: "الحالة", en: "Status" },
  active: { ar: "مفعّل", en: "Active" },
  obsolete: { ar: "ملغى", en: "Obsolete" },
  inactive: { ar: "موقوف", en: "Disabled" },
  noFile: { ar: "لا يوجد ملف", en: "No file" },
  empty: { ar: "لا توجد بيانات بعد.", en: "Nothing here yet." },
  forms: { ar: "النماذج", en: "Forms" },
  form: { ar: "نموذج", en: "Form" },
  sop: { ar: "إجراء عمل قياسي", en: "Standard operating procedure" },
  manual: { ar: "دليل الجودة", en: "Quality manual" },
  issueWithdrawForm: { ar: "نموذج الإصدار والسحب", en: "Issue & withdrawal form" },
  // login
  loginTitle: { ar: "تسجيل الدخول", en: "Sign in" },
  username: { ar: "اسم المستخدم أو البريد", en: "Username or email" },
  password: { ar: "كلمة المرور", en: "Password" },
  signIn: { ar: "دخول", en: "Sign in" },
  loginError: { ar: "اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب موقوف.", en: "Wrong username or password, or the account is disabled." },
} as const;

export type DictKey = keyof typeof dict;
export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}
export function makeT(lang: Lang) {
  return (key: DictKey) => dict[key][lang];
}
