import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Barlow, IBM_Plex_Sans_Arabic } from "next/font/google";
import { SITE_SCRIPT } from "@/lib/siteScript";
import "./globals.css";

const latin = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-latin",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "الصخرة للصناعة | Al-Sakhra for Industry",
  description:
    "مصنع وطني في المدينة الصناعية بالخرج لصناعة المنظفات والمطهرات ومستحضرات العناية. Saudi factory in Al-Kharj manufacturing detergents, disinfectants and care products.",
  icons: { icon: "/logo/mark-color.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a2a85",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Arabic is the default; the language switch (lib/siteScript.ts) changes lang/dir/data-lang.
    <html lang="ar" dir="rtl" data-lang="ar" className={`${latin.variable} ${arabic.variable}`} suppressHydrationWarning>
      <body className="bg-white text-ink antialiased">
        {children}
        <Script id="site-behaviour" strategy="afterInteractive">{SITE_SCRIPT}</Script>
      </body>
    </html>
  );
}
