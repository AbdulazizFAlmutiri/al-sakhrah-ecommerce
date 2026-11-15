import type { Metadata, Viewport } from "next";
import { Barlow, IBM_Plex_Sans_Arabic } from "next/font/google";
import { getLang } from "@/lib/i18n";
import "./globals.css";

const latin = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-latin" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "نظام الجودة | الصخرة للصناعة",
  description: "Quality management system, AlSakhra Factory for Manufacturing",
  robots: { index: false, follow: false }, // internal system: keep it out of search engines
};
export const viewport: Viewport = { themeColor: "#061a4f" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${latin.variable} ${arabic.variable}`}>
      <body className="bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
