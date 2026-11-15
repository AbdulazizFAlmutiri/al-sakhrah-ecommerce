// Local design preview only: `QUALITY_DEMO=1 npm run dev` shows the app with sample data
// and a signed-in admin, without Supabase. Never active in a production build.
import type { Clause, Copy, Department, Doc, Evidence, Form, Paper } from "./data";

export const DEMO = process.env.QUALITY_DEMO === "1" && process.env.NODE_ENV !== "production";

export const demoUser = { id: "demo", username: "admin", fullName: "مدير النظام", role: "admin" as const, department: null };

export const demoDepartments: Department[] = [
  ["TECH", "الإدارة الفنية", "Technical"], ["QC", "الجودة", "Quality control"], ["PR", "الإنتاج", "Production"],
  ["WH", "المستودعات", "Warehouses"], ["MO", "الصيانة والتشغيل", "Maintenance & operation"], ["HR", "الموارد البشرية", "Human resources"],
  ["CL", "النظافة", "Cleaning"], ["MS", "التسويق والمبيعات", "Marketing & sales"], ["PU", "المشتريات", "Purchasing"],
].map(([code, name_ar, name_en], i) => ({ code, name_ar, name_en, sort: (i + 1) * 10, holds_copies: true }));

const titles: [string, string, string][] = [
  ["QC", "ضبط الوثائق والسجلات", "Control of documents and records"],
  ["QC", "فحص المواد الخام عند الاستلام", "Incoming raw material inspection"],
  ["QC", "فحص المنتج النهائي", "Finished product inspection"],
  ["QC", "التعامل مع المنتج غير المطابق", "Non-conforming product"],
  ["PR", "تشغيل خط التعبئة", "Filling line operation"],
  ["PR", "خلط الدفعات وتسجيلها", "Batch mixing and records"],
  ["PR", "تنظيف المعدات بين الدفعات", "Equipment cleaning between batches"],
  ["WH", "استلام وتخزين المواد", "Receiving and storing materials"],
  ["WH", "صرف المنتجات وفق نظام الوارد أولًا", "FIFO dispatch"],
  ["MO", "الصيانة الوقائية للمعدات", "Preventive maintenance"],
  ["HR", "تدريب وتأهيل العاملين", "Staff training"],
  ["PU", "تقييم الموردين واعتمادهم", "Supplier evaluation"],
];

const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

export const demoDocuments: Doc[] = [
  {
    id: "m1", code: "QMD-QC-0001", title_ar: "دليل الجودة", title_en: "Quality manual", doc_type: "manual", department: "QC", version: "2.0", status: "active",
    prepared_at: day(-700), reviewed_at: day(-695), approved_at: day(-690), issued_at: day(-690), effective_at: day(-685), implementation_start_at: day(-680),
    next_review_at: day(40), file_ar: "demo.pdf", file_en: null, sort: 1,
  },
  ...titles.map(([dep, ar, en], i) => ({
    id: `d${i}`, code: `SOP-${dep}-${String(i + 1).padStart(4, "0")}`, title_ar: ar, title_en: en, doc_type: "sop" as const, department: dep,
    version: "1.0", status: "active" as const, prepared_at: day(-400), reviewed_at: day(-395), approved_at: day(-390),
    issued_at: day(i === 2 ? -740 : -390 + i * 10), effective_at: day(-385), implementation_start_at: day(-380),
    next_review_at: day(i === 2 ? -10 : 340 + i * 10), file_ar: "demo.pdf", file_en: null, sort: i,
  })),
];

export const demoForms: Form[] = demoDocuments.flatMap((d, i) =>
  [1, 2].slice(0, (i % 3) + 1).map((n) => ({
    id: `${d.id}-f${n}`, code: `F0${n}-${d.code.slice(4)}`, title_ar: n === 1 ? "سجل المتابعة اليومي" : "نموذج الفحص", title_en: n === 1 ? "Daily log" : "Inspection form",
    document_id: d.id, file: "demo.pdf", sort: n,
  })),
);

export const demoCopies: Copy[] = demoDocuments.slice(0, 8).flatMap((d, i) =>
  ["QC", "PR", "WH", "MO"].slice(0, (i % 4) + 1).map((dep, n) => ({
    id: `${d.id}-c${n}`, document_id: d.id, copy_number: n + 1, department: dep, status: (i === 3 && n === 0 ? "cancelled" : "distributed") as Copy["status"],
    issued_at: day(-300), withdrawn_at: i === 3 && n === 0 ? day(-20) : null, withdraw_reason: i === 3 && n === 0 ? "إصدار جديد" : null,
  })),
);

export const demoClauses: Clause[] = Array.from({ length: 24 }, (_, i) => ({
  number: i + 1,
  text_ar: ["يجب أن يكون لدى المصنع نظام موثق لضبط الوثائق.", "يجب فحص المواد الخام قبل الاستخدام وتسجيل النتائج.", "يجب معايرة أجهزة القياس دوريًا.", "يجب تدريب العاملين وتوثيق التدريب."][i % 4],
  text_en: null, reference: `1/${Math.floor(i / 4) + 1}/${(i % 4) + 1}`, severity: (i % 5 === 0 ? "major" : "minor") as Clause["severity"],
  assessor_notes: i % 3 === 0 ? "مطبق" : null, inspection_notes: null, updated_at: day(-5),
}));

export const demoEvidence: Evidence[] = demoClauses.filter((c) => c.number % 2 === 0).map((c) => ({
  id: `e${c.number}`, clause_number: c.number, document_id: "d0", form_id: null, paper_id: null, label: null, file: null,
}));

export const demoPapers: Paper[] = [
  ["general", "السجل التجاري", "Commercial registration"], ["general", "الترخيص الصناعي", "Industrial licence"], ["general", "شهادة ضريبة القيمة المضافة", "VAT certificate"],
  ["calibration", "معايرة الميزان الرقمي", "Digital scale calibration"], ["calibration", "معايرة جهاز قياس الحموضة", "pH meter calibration"],
  ["contract", "عقد مكافحة الحشرات", "Pest control contract"], ["contract", "عقد نقل النفايات", "Waste removal contract"],
].map(([category, title_ar, title_en], i) => ({ id: `p${i}`, category: category as Paper["category"], title_ar, title_en, file: "demo.pdf", sort: i }));
