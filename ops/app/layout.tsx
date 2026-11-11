import type { Metadata } from "next";
import { Almarai, Barlow, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const almarai = Almarai({ subsets: ["arabic"], weight: ["300", "400", "700", "800"], variable: "--font-almarai" });
const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-barlow" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-naskh" });

export const metadata: Metadata = {
  title: "Al-Sakhrah Ops",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} ${barlow.variable} ${naskh.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0..1,0&display=block"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
