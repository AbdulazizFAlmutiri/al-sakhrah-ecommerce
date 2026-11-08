import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Barlow, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_SCRIPT } from "@/lib/siteScript";
import { SEO, SITE_NAME, SITE_URL, organizationJsonLd } from "@/lib/site";
import "@/app/globals.css";

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

export type Lang = "ar" | "en";

export function buildMetadata(lang: Lang): Metadata {
  const seo = SEO[lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: lang === "en" ? "/en" : "/",
      languages: { ar: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      url: lang === "en" ? "/en" : "/",
      siteName: lang === "en" ? SITE_NAME.en : SITE_NAME.ar,
      title: seo.title,
      description: seo.description,
      locale: lang === "en" ? "en_US" : "ar_SA",
      alternateLocale: lang === "en" ? ["ar_SA"] : ["en_US"],
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  };
}

export const viewport: Viewport = { themeColor: "#0a2a85" };

/** Shared <html>/<body> for both language root layouts. */
export function RootShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      data-lang={lang}
      className={`${latin.variable} ${arabic.variable}`}
    >
      <body className="bg-white text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(lang)).replace(/</g, "\\u003c") }}
        />
        {children}
        <Script id="site-behaviour" strategy="afterInteractive">{SITE_SCRIPT}</Script>
        <Analytics />
      </body>
    </html>
  );
}
