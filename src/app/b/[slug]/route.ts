import { getSite, renderSite } from "@/lib/hostedSite";

// An owner's free one-page website (published from their Launch Kit). Served as plain HTML,
// outside the MapDebut layout, so it reads as the business's own page.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = /^[a-z0-9-]{3,50}$/.test(slug) ? await getSite(slug) : null;
  if (!site) return new Response("This page isn't published.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(renderSite(site), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
  });
}
