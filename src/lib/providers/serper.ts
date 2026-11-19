import "server-only";
import { env } from "../env";
import { spend, SpendCapError } from "../guard";
import { coreName, mentions } from "./ai";

// Listings check through Serper.dev (Google search results as JSON), used when DataForSEO has no balance.
// site: searches find the business's own Yelp, Facebook, Apple Maps and directory pages.
// About $0.001 a search or less. Docs: https://serper.dev
// A page we can't see reads "can't tell", never "no": search engines don't index every listing.

interface Organic {
  title?: string;
  link?: string;
  snippet?: string;
}

export const hasSerper = () => !!env.serper;

async function search(q: string): Promise<Organic[]> {
  await spend("serper");
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": env.serper, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: "us", hl: "en", num: 10 }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Serper ${res.status} ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { organic?: Organic[] }).organic || [];
}

/** Same search, but null instead of throwing, so one failed search never breaks a report. */
async function safe(q: string): Promise<Organic[] | null> {
  try {
    return await search(q);
  } catch (e) {
    if (!(e instanceof SpendCapError)) console.error("serper", q, e);
    return null;
  }
}

const host = (link = "") => {
  try {
    return new URL(link).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};
const path = (link = "") => {
  try {
    return new URL(link).pathname.toLowerCase();
  } catch {
    return "";
  }
};
// Titles look like "QIAO LIN HOTPOT - Updated November 2026 - Duluth, GA - Yelp": match on the business name.
const names = (o: Organic, name: string) => mentions(o.title || "", name);

const isYelpBiz = (o: Organic, name: string) => host(o.link).endsWith("yelp.com") && path(o.link).startsWith("/biz/") && names(o, name);
const isFacebookPage = (o: Organic, name: string) =>
  host(o.link).endsWith("facebook.com") && !/^\/(groups|events|marketplace|watch|share|search|hashtag|public)\b/.test(path(o.link)) && names(o, name);
const isAppleMaps = (o: Organic, name: string) => host(o.link) === "maps.apple.com" && names(o, name);
const onDomain = (o: Organic, name: string, domain: string) => host(o.link).endsWith(domain.toLowerCase()) && names(o, name);

const town = (address: string) => {
  // "3473 Old Norcross Rd #100B, Duluth, GA 30096, USA" -> "Duluth GA"
  const parts = address.split(",").map((s) => s.trim());
  return parts.length >= 3 ? `${parts[parts.length - 3]} ${parts[parts.length - 2].replace(/\s*\d{5}(-\d{4})?$/, "")}` : address;
};

export interface SerperHit {
  yelp: boolean | null;
  facebook: boolean | null;
  apple: boolean | null;
  /** Industry directory domains with this business's page; null when not checked or the search failed. */
  others: string[] | null;
}

/**
 * The business itself: 4 searches (Yelp, Facebook, Apple Maps, industry directories).
 * Found = true. Not found = null ("can't tell").
 */
export async function ownerListings(name: string, address: string, domains: string[]): Promise<SerperHit> {
  const where = town(address);
  const q = `"${coreName(name)}" ${where}`;
  const [yelp, fb, apple, dirs] = await Promise.all([
    safe(`site:yelp.com/biz ${q}`),
    safe(`site:facebook.com ${q}`),
    safe(`site:maps.apple.com ${q}`),
    domains.length ? safe(`${q} (${domains.map((d) => `site:${d}`).join(" OR ")})`) : Promise.resolve([] as Organic[]),
  ]);
  return {
    yelp: yelp && yelp.some((o) => isYelpBiz(o, name)) ? true : null,
    facebook: fb && fb.some((o) => isFacebookPage(o, name)) ? true : null,
    apple: apple && apple.some((o) => isAppleMaps(o, name)) ? true : null,
    others: dirs ? domains.filter((d) => dirs.some((o) => onDomain(o, name, d))) : null,
  };
}

/** A rival: one search for Yelp and Facebook together. */
export async function rivalListings(name: string, address: string): Promise<Pick<SerperHit, "yelp" | "facebook">> {
  const res = await safe(`"${coreName(name)}" ${town(address)} (site:yelp.com/biz OR site:facebook.com)`);
  return {
    yelp: res && res.some((o) => isYelpBiz(o, name)) ? true : null,
    facebook: res && res.some((o) => isFacebookPage(o, name)) ? true : null,
  };
}
