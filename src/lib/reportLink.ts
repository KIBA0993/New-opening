import "server-only";
import { env } from "./env";
import { industryBySlug } from "./industries";
import { getPlace } from "./providers/places";

/**
 * The "your free check" emails go to any address someone types, so nothing in them may come
 * straight from the browser. This rebuilds the report link from its parts (a place id, a known
 * industry, and for a business not on Google yet its name and city) and takes the business name
 * from Google, so the email can't carry anyone else's words or links.
 */
export async function reportEmailTarget(reportPath: string): Promise<{ url: string; name: string } | null> {
  let u: URL;
  try {
    u = new URL(reportPath, env.siteUrl);
  } catch {
    return null;
  }
  if (u.origin !== new URL(env.siteUrl).origin) return null;
  const m = u.pathname.match(/^\/report\/([A-Za-z0-9_-]{1,300})$/);
  const industry = industryBySlug(u.searchParams.get("industry"))?.slug;
  if (!m || !industry) return null;
  const id = m[1];
  const out = new URL(`/report/${id}`, env.siteUrl);
  out.searchParams.set("industry", industry);

  if (id === "new") {
    const name = clean(u.searchParams.get("name"), 120);
    const city = clean(u.searchParams.get("city"), 120);
    if (!name || !city) return null;
    out.searchParams.set("name", name);
    out.searchParams.set("city", city);
    return { url: out.toString(), name };
  }
  const place = await getPlace(id);
  if (!place) return null;
  return { url: out.toString(), name: place.name.slice(0, 120) };
}

/** Plain words only: no markup, and nothing an email app would turn into a link ("Joe.com" -> "Joe com"). */
function clean(v: string | null, max: number) {
  return (v || "")
    .replace(/[<>"]/g, "")
    .replace(/https?:\/\//gi, "")
    .replace(/\b(www)\./gi, "$1 ")
    .replace(/\.(?=[a-z]{2,}\b)/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
