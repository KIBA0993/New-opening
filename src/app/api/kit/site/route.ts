import { NextResponse } from "next/server";
import { z } from "zod";
import { allowIp } from "@/lib/guard";
import { publishSite, SiteInput, siteUrl, unpublishSite } from "@/lib/hostedSite";
import { industryBySlug } from "@/lib/industries";
import { kitOwner } from "@/lib/kitAccess";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish"), key: z.string().min(5).max(2000), site: z.unknown() }),
  z.object({ action: z.literal("unpublish"), key: z.string().min(5).max(2000) }),
]);

// Publish, update or take down a Kit buyer's free page at /b/<slug>.
export async function POST(req: Request) {
  if (!(await allowIp("kitsite", 30, 600))) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const b = parsed.data;
  if (b.key.startsWith("preview:")) return NextResponse.json({ error: "Preview kits can't publish a page." }, { status: 403 });
  const profile = await kitOwner(b.key);
  if (!profile) return NextResponse.json({ error: "We couldn't open this Kit." }, { status: 404 });

  if (b.action === "unpublish") {
    await unpublishSite(b.key);
    return NextResponse.json({ ok: true });
  }
  const input = SiteInput.safeParse(b.site);
  if (!input.success) {
    const first = input.error.issues[0];
    return NextResponse.json({ error: first?.message || "Please check the page.", field: first?.path.join(".") }, { status: 400 });
  }
  const res = await publishSite({
    ...input.data,
    key: b.key,
    name: profile.name,
    city: profile.city,
    address: profile.address,
    serviceArea: !!industryBySlug(profile.industry)?.serviceArea,
    placeId: profile.placeId,
  });
  if (!res.ok) return NextResponse.json({ error: res.error, field: "slug" }, { status: 409 });
  return NextResponse.json({ ok: true, url: siteUrl(res.site.slug), site: res.site });
}
