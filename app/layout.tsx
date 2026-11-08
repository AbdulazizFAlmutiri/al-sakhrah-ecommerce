import type { Metadata, Viewport } from "next";
import { Barlow, IBM_Plex_Sans_Arabic } from "next/font/google";
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
  title: "Al-Sakhra for Industry | الصخرة للصناعة",
  description:
    "Saudi national factory in Al-Kharj Industrial City manufacturing detergents and care preparations. مصنع وطني لصناعة المنظفات ومستحضرات العناية.",
  icons: { icon: "/logo/mark-color.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a2a85",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${arabic.variable}`}>
      <body className="bg-white text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
