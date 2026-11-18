import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// AI crawlers are welcome: being cited by ChatGPT, Perplexity and Gemini is the point.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/kit", "/report/", "/start", "/autopilot/welcome", "/cancel"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
