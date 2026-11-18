import type { MetadataRoute } from "next";
import { GUIDES_CONTENT } from "@/lib/guides";
import { INDUSTRIES } from "@/lib/industries";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tools/chatgpt-visibility-checker`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/tools/google-review-link`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/autopilot`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...INDUSTRIES.map((i) => ({ url: `${SITE_URL}/for/${i.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...GUIDES_CONTENT.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
