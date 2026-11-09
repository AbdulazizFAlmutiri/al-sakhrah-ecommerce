import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ar: `${SITE_URL}/`, en: `${SITE_URL}/en` };
  return [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${SITE_URL}/en`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2, alternates: { languages: { ar: `${SITE_URL}/privacy`, en: `${SITE_URL}/en/privacy` } } },
    { url: `${SITE_URL}/en/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2, alternates: { languages: { ar: `${SITE_URL}/privacy`, en: `${SITE_URL}/en/privacy` } } },
  ];
}
