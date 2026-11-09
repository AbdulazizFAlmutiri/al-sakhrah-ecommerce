import type { Metadata } from "next";
import PrivacyPage from "@/components/Privacy";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | الصخرة للصناعة",
  description: "كيف يتعامل مصنع الصخرة للصناعة مع البيانات التي يستلمها عبر الموقع وواتساب والبريد الإلكتروني.",
  alternates: { canonical: "/privacy", languages: { ar: "/privacy", en: "/en/privacy" } },
};

export default function Page() {
  return <PrivacyPage />;
}
