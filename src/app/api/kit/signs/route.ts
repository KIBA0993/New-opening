import { NextResponse } from "next/server";
import { allowIp } from "@/lib/guard";
import { industryBySlug } from "@/lib/industries";
import { kitOwner } from "@/lib/kitAccess";
import { reviewLink } from "@/lib/providers/places";
import { reviewSignsPdf } from "@/lib/signs";

// Printable review signs (PDF) for a Kit: counter sign, table tent and a sheet of cards.
export async function GET(req: Request) {
  if (!(await allowIp("kitsigns", 30, 600))) return new NextResponse("Too many tries. Please wait a few minutes.", { status: 429 });
  const key = new URL(req.url).searchParams.get("key") || "";
  const profile = key ? await kitOwner(key) : null;
  if (!profile) return new NextResponse("We couldn't open this Kit.", { status: 404 });
  const url = reviewLink(profile.placeId);
  if (url.includes("YOUR_PLACE_ID")) return new NextResponse("Your review signs are ready once your Google profile is live.", { status: 400 });
  const pdf = await reviewSignsPdf({ name: profile.name, reviewUrl: url, serviceArea: !!industryBySlug(profile.industry)?.serviceArea });
  const file = `${profile.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "review"}-review-signs.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "private, no-store" },
  });
}
