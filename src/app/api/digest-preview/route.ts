import { NextResponse } from "next/server";
import { composeDigest } from "@/lib/digest";
import { env } from "@/lib/env";
import { renderDigestHtml } from "@/lib/email";
import { industryBySlug } from "@/lib/industries";
import type { IndustrySlug } from "@/lib/types";

export const maxDuration = 120;

// Owner-only preview of the real weekly email for any business:
// /api/digest-preview?secret=CRON_SECRET&placeId=...&industry=beauty&services=...
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const devOpen = !env.cronSecret && process.env.NODE_ENV !== "production";
  if (!devOpen && (!env.cronSecret || u.get("secret") !== env.cronSecret)) return new NextResponse("Unauthorized", { status: 401 });
  const industry = (industryBySlug(u.get("industry"))?.slug || "home-services") as IndustrySlug;
  const { digest } = await composeDigest(
    {
      placeId: u.get("placeId") || "demo_bright-day-cleaning",
      name: u.get("name") || "Bright Day Cleaning",
      address: u.get("city") || "Austin, TX",
      city: u.get("city") || "Austin, TX",
      industry,
      managesProfile: "yes",
      services: u.get("services") || "",
      different: u.get("different") || "",
      areas: u.get("areas") || "",
      email: "preview@example.com",
    },
    null,
  );
  return new NextResponse(renderDigestHtml(digest), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
