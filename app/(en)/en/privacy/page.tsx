import type { Metadata } from "next";
import PrivacyPage from "@/components/Privacy";

export const metadata: Metadata = {
  title: "Privacy policy | Al-Sakhra for Industry",
  description: "How AlSakhra Factory for Manufacturing handles information received through the website, WhatsApp and email.",
  alternates: { canonical: "/en/privacy", languages: { ar: "/privacy", en: "/en/privacy" } },
};

export default function Page() {
  return <PrivacyPage />;
}
