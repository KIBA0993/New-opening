import "server-only";
import { unstable_cache } from "next/cache";
import { env, has } from "../env";
import { spend } from "../guard";
import type { Place } from "../types";

// Extra Google Business Profile facts for the readiness score, through DataForSEO:
//  - the business's own profile: written description, total photos, claimed or not
//    (business_data/google/my_business_info/live, about half a cent, kept a week)
//  - photo counts for nearby rivals, from one Maps search at the shop (kept a day)
// Plus a free check that the business's website shows the same phone number as Google.

const auth = () => "Basic " + Buffer.from(`${env.dataforseoLogin}:${env.dataforseoPassword}`).toString("base64");

async function dfs<T>(path: string, task: Record<string, unknown>): Promise<T | null> {
  await spend("dataforseo");
  const res = await fetch(`https://api.dataforseo.com/v3/${path}`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  if (!res.ok) throw new Error(`DataForSEO ${res.status}`);
  const data = (await res.json()) as { tasks?: { status_code?: number; status_message?: string; result?: T[] }[] };
  const t = data.tasks?.[0];
  if (t?.status_code !== 20000) throw new Error(`DataForSEO ${t?.status_code} ${t?.status_message}`);
  return t.result?.[0] ?? null;
}

export interface ProfileFacts {
  description: string | null | undefined; // undefined = not looked up
  totalPhotos: number | null;
  claimed: boolean | null;
  extraCategories: number | null;
}

interface InfoItem { description?: string; total_photos?: number; is_claimed?: boolean; additional_categories?: string[] | null; place_id?: string }

/** The profile facts straight from DataForSEO, no cache (the Kit's progress check). Throws on failure. */
export async function readProfileFacts(placeId: string): Promise<ProfileFacts | null> {
  const r = await dfs<{ items?: InfoItem[] }>("business_data/google/my_business_info/live", { keyword: `place_id:${placeId}`, language_code: "en", location_code: 2840 });
  const it = r?.items?.[0];
  if (!it) return null;
  return {
    description: it.description?.trim() || null,
    totalPhotos: typeof it.total_photos === "number" ? it.total_photos : null,
    claimed: typeof it.is_claimed === "boolean" ? it.is_claimed : null,
    extraCategories: Array.isArray(it.additional_categories) ? it.additional_categories.length : null,
  };
}

export function profileFacts(place: Place): Promise<ProfileFacts | null> {
  if (!has.dataforseo() || place.id === "new" || place.id.startsWith("demo_")) return Promise.resolve(null);
  return unstable_cache(() => readProfileFacts(place.id), ["profile-facts-v1", place.id], { revalidate: 60 * 60 * 24 * 7 })().catch((e) => {
    console.error("profile facts", place.name, e);
    return null;
  });
}

/** Photo counts (and claimed status) for businesses showing in Maps at the shop, by Google place id. */
export function nearbyPhotos(place: Place, keyword: string): Promise<Record<string, { photos: number | null; claimed: boolean | null }> | null> {
  if (!has.dataforseo() || place.lat == null || place.lng == null || place.id.startsWith("demo_")) return Promise.resolve(null);
  return unstable_cache(
    async () => {
      const r = await dfs<{ items?: { type?: string; place_id?: string; total_photos?: number; is_claimed?: boolean }[] }>("serp/google/maps/live/advanced", {
        keyword,
        location_coordinate: `${place.lat!.toFixed(6)},${place.lng!.toFixed(6)},14z`,
        language_code: "en",
        depth: 20,
      });
      const out: Record<string, { photos: number | null; claimed: boolean | null }> = {};
      for (const i of r?.items || []) {
        if (i.type === "maps_search" && i.place_id) out[i.place_id] = { photos: i.total_photos ?? null, claimed: i.is_claimed ?? null };
      }
      return out;
    },
    ["nearby-photos-v1", place.id, keyword],
    { revalidate: 60 * 60 * 24 },
  )().catch((e) => {
    console.error("nearby photos", place.name, e);
    return null;
  });
}

export interface SiteFacts {
  phone: boolean | null; // shows the same phone as Google
  name: boolean | null; // shows the business name
  servicePages: number; // internal pages that look like service pages
  areaPage: boolean; // a page for the city or areas served
  schema: boolean; // LocalBusiness-style JSON-LD
  credentials: boolean; // mentions a license, insurance or certification
  prices: boolean; // shows prices
  address: boolean | null; // shows the street address Google has (null = no street number to look for)
  blocked: { chatgpt: boolean; perplexity: boolean; gemini: boolean } | null; // robots.txt shuts out the AI search crawler
}

const NOT_SERVICE = /^(about|contact|blog|news|privacy|terms|cart|checkout|account|login|signin|sign-in|register|faq|faqs|careers|jobs|gallery|reviews|testimonials|team|book|booking|shop|store|search|tag|category|author|feed|wp-|cdn-|policy|sitemap|home|index)/;
const SERVICE_HINT = /service|repair|install|clean|cut|color|nail|lash|brow|wax|massage|facial|groom|board|walk|train|cater|menu|treat|therapy|plumb|electric|roof|hvac|heat|cool|paint|lawn|landscap|pest|pool|move|haul|detail|wash|remov/;

function blockedFor(robots: string, agent: string): boolean {
  // Group robots.txt rules by user-agent and see whether the bot's own group (or "*") disallows the whole site.
  const groups: { agents: string[]; rules: string[] }[] = [];
  let cur: { agents: string[]; rules: string[] } | null = null;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, key, val] = m;
    if (key.toLowerCase() === "user-agent") {
      if (!cur || cur.rules.length) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(val.toLowerCase());
    } else if (cur && /^(dis)?allow$/i.test(key)) cur.rules.push(`${key.toLowerCase()}:${val.trim()}`);
  }
  const own = groups.find((g) => g.agents.includes(agent.toLowerCase())) || groups.find((g) => g.agents.includes("*"));
  if (!own) return false;
  return own.rules.includes("disallow:/") && !own.rules.some((r) => r.startsWith("allow:/"));
}

/** Does the page text show the street address ("1200 Elm")? null when the address has no street number. */
function streetIn(address: string | undefined, lowerText: string): boolean | null {
  const m = (address || "").match(/^\s*(\d+[a-z]?)\s+([a-z0-9]+)/i);
  if (!m) return null;
  return new RegExp(`\\b${m[1].toLowerCase()}\\s+(?:[nsew]\\.?\\s+)?${m[2].toLowerCase()}`).test(lowerText.replace(/\s+/g, " "));
}

/** What the business's website shows that AI assistants look for, read now (no cache). Throws when the site can't be read. */
export async function readSite(place: Place): Promise<SiteFacts | null> {
  const want = (place.phone || "").replace(/\D/g, "").slice(-10);
  if (!place.website) return null;
  const headers = { "User-Agent": "Mozilla/5.0 (compatible; MapDebutCheck/1.0; +https://mapdebut.com)" };
  const res = await fetch(place.website!, { headers, signal: AbortSignal.timeout(6000), redirect: "follow" });
  if (!res.ok || !(res.headers.get("content-type") || "").includes("html")) return null;
  const base = new URL(res.url || place.website!);
  const html = (await res.text()).slice(0, 600_000);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const lower = text.toLowerCase();
  const digits = text.replace(/\D/g, "");
  const words = place.name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2).slice(0, 2);

  // Internal links, one level of path, that read like services.
  const paths = new Set<string>();
  let areaPage = false;
  const town = (place.city || "").split(",")[0].trim().toLowerCase();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u: URL;
    try {
      u = new URL(m[1], base);
    } catch {
      continue;
    }
    if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
    const path = u.pathname.toLowerCase().replace(/\/+$/, "");
    const label = m[2].replace(/<[^>]+>/g, " ").toLowerCase();
    if (!path || path === "/") continue;
    const slug = path.split("/").filter(Boolean).pop() || "";
    if (/area|location|city|serv(e|ing)-|near/.test(path) || (town.length > 2 && (path.includes(town.replace(/\s+/g, "-")) || label.includes(town)))) areaPage = true;
    if (NOT_SERVICE.test(slug)) continue;
    if (SERVICE_HINT.test(path) || SERVICE_HINT.test(label) || path.startsWith("/services/")) paths.add(path);
  }

  let blocked: SiteFacts["blocked"] = null;
  try {
    const r = await fetch(new URL("/robots.txt", base), { headers, signal: AbortSignal.timeout(4000) });
    const body = r.ok ? (await r.text()).slice(0, 100_000) : "";
    blocked = { chatgpt: blockedFor(body, "OAI-SearchBot"), perplexity: blockedFor(body, "PerplexityBot"), gemini: blockedFor(body, "Google-Extended") };
  } catch {
    blocked = null;
  }

  return {
    phone: want.length === 10 ? digits.includes(want) || digits.includes("1" + want) : null,
    name: words.length ? words.every((w) => lower.includes(w)) : null,
    servicePages: paths.size,
    areaPage,
    schema: /application\/ld\+json[\s\S]{0,4000}?"@type"\s*:\s*\[?\s*"[A-Za-z]*(LocalBusiness|Service|Store|Restaurant|Salon|Shop|Plumber|Electrician|Contractor|Dentist|Spa|Cleaning|Care|Clinic|Physician|Business)"/i.test(html),
    credentials: /\blicen[cs]ed\b|\blicen[cs]e\s*(#|no\.?|number)|\binsured\b|\bbonded\b|\bcertified\b|\bcertification\b|\baccredited\b/i.test(text),
    prices: /\$\s?\d{2,}/.test(text),
    address: streetIn(place.address, lower),
    blocked,
  };
}

/** Same, cached a week. Two free fetches. null when we can't read it. */
export function siteFacts(place: Place): Promise<SiteFacts | null> {
  const want = (place.phone || "").replace(/\D/g, "").slice(-10);
  if (!place.website || place.id.startsWith("demo_")) return Promise.resolve(null);
  return unstable_cache(() => readSite(place), ["site-facts-v1", place.id, place.website, want], { revalidate: 60 * 60 * 24 * 7 })().catch(() => null);
}

/** Does the business's website show the same phone number as Google? null when we can't tell. */
export async function websiteMatches(place: Place): Promise<{ phone: boolean | null; name: boolean | null } | null> {
  const f = await siteFacts(place);
  return f ? { phone: f.phone, name: f.name } : null;
}
