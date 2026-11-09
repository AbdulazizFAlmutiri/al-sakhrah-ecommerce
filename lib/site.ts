import { CONTACT, LEGAL } from "./content";

// Public address of the site. On Vercel this is the production domain
// (it switches to alsakhrah.com automatically once that domain is connected).
// Set NEXT_PUBLIC_SITE_URL to override.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = { ar: "الصخرة للصناعة", en: "Al-Sakhra for Industry" };

export const SEO = {
  ar: {
    title: "الصخرة للصناعة | مصنع منظفات ومطهرات في الخرج",
    description:
      "مصنع وطني في المدينة الصناعية بالخرج لصناعة المنظفات والمطهرات ومستحضرات العناية. توريد للمنشآت والجهات الحكومية، تصنيع لعلامتك الخاصة، معتمد ISO 9001 وهيئة الغذاء والدواء وصناعة سعودية.",
    keywords: ["مصنع منظفات", "مصنع منظفات الخرج", "مطهرات", "كلور", "منظفات صناعية", "توريد منظفات", "تصنيع علامة خاصة", "منظفات للمستشفيات", "صناعة سعودية"],
  },
  en: {
    title: "Al-Sakhra for Industry | Detergent & Disinfectant Factory in Saudi Arabia",
    description:
      "Saudi national factory in Al-Kharj Industrial City manufacturing detergents, disinfectants and care products. Institutional and government supply, private label manufacturing. ISO 9001, SFDA approved, Saudi Made.",
    keywords: ["detergent manufacturer Saudi Arabia", "disinfectant factory", "private label detergents", "chlorine bleach supplier", "Al-Kharj factory", "Saudi Made", "institutional cleaning products"],
  },
};

// Structured data for search engines (schema.org Organization).
export function organizationJsonLd(lang: "ar" | "en") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: lang === "ar" ? SITE_NAME.ar : SITE_NAME.en,
    alternateName: lang === "ar" ? SITE_NAME.en : SITE_NAME.ar,
    url: `${SITE_URL}${lang === "en" ? "/en" : "/"}`,
    logo: `${SITE_URL}/logo/logo-color.png`,
    legalName: LEGAL.name[lang],
    vatID: LEGAL.vat,
    taxID: LEGAL.vat,
    identifier: [
      { "@type": "PropertyValue", propertyID: "CR Unified Number", value: LEGAL.cr },
      { "@type": "PropertyValue", propertyID: "Industrial Licence", value: LEGAL.industrialLicence },
    ],
    email: CONTACT.email,
    telephone: "+966556268175",
    description: SEO[lang].description,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Al-Kharj",
      postalCode: "16417",
      addressRegion: "Riyadh Province",
      addressCountry: "SA",
      streetAddress: lang === "ar" ? "3090 الدلم 375، المدينة الصناعية بالخرج" : "3090 Aldlam 375, Al-Kharj Industrial City",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: "+966556268175",
      email: CONTACT.email,
      availableLanguage: ["Arabic", "English"],
      areaServed: "SA",
    },
  };
}
