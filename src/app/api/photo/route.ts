import { env, has } from "@/lib/env";

// Proxies Google place photos so the API key never reaches the browser.
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name") || "";
  if (!has.places() || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(name)) return new Response(null, { status: 404 });
  const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=480&key=${env.googlePlaces}`);
  if (!res.ok) return new Response(null, { status: 404 });
  return new Response(res.body, {
    headers: { "Content-Type": res.headers.get("Content-Type") || "image/jpeg", "Cache-Control": "public, max-age=86400" },
  });
}
