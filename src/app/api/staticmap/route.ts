import { env } from "@/lib/env";
import { allowIp } from "@/lib/guard";

// A quiet street map behind the Maps grid. Proxied so the Google key never reaches the browser.
// Needs "Maps Static API" turned on for the key (GOOGLE_MAPS_STATIC_KEY, or the Places key).
const STYLE = [
  "feature:poi|visibility:off",
  "feature:transit|visibility:off",
  "element:labels.icon|visibility:off",
  "saturation:-70|lightness:15",
];

export async function GET(req: Request) {
  const key = process.env.GOOGLE_MAPS_STATIC_KEY || env.googlePlaces;
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const zoom = Number(u.searchParams.get("z"));
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180 || !(zoom >= 10 && zoom <= 17)) {
    return new Response(null, { status: 404 });
  }
  if (!(await allowIp("staticmap", 60, 600))) return new Response(null, { status: 429 });
  const g = new URL("https://maps.googleapis.com/maps/api/staticmap");
  g.searchParams.set("center", `${lat.toFixed(5)},${lng.toFixed(5)}`);
  g.searchParams.set("zoom", String(Math.round(zoom)));
  g.searchParams.set("size", "640x640");
  g.searchParams.set("scale", "2");
  g.searchParams.set("key", key);
  for (const s of STYLE) g.searchParams.append("style", s);
  const res = await fetch(g, { cache: "no-store" }); // Google's terms don't allow us to store map images
  if (!res.ok || !(res.headers.get("content-type") || "").startsWith("image/")) {
    console.error("staticmap", res.status, (await res.text()).slice(0, 200));
    return new Response(null, { status: 404 });
  }
  return new Response(res.body, {
    headers: { "Content-Type": res.headers.get("content-type")!, "Cache-Control": "private, max-age=86400" },
  });
}
