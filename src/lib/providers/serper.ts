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
// Names with Chinese, Japanese or Korean characters ("Xi Hotpot & Chinese Cuisine 大渝喜筵火锅电烤串") are
// searched and matched by their Latin part; " - Duluth GA" style suffixes are dropped too.
const NON_LATIN = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef\uac00-\ud7af]+/g;
export function latinName(name: string) {
  const plain = name.replace(NON_LATIN, " ").replace(/\s+/g, " ").trim();
  return coreName(plain || name);
}

interface Who {
  name: string;
  city: string; // "Duluth"
  phone?: string;
  street?: string; // "3473 old norcross"
}

/** The page is about this location: it names the city, the phone or the street. Keeps other branches of a chain out. */
function local(o: Organic, w: Who) {
  const text = `${o.title || ""} ${o.snippet || ""} ${o.link || ""}`.toLowerCase();
  const city = w.city.toLowerCase();
  const phone = (w.phone || "").replace(/\D/g, "").slice(-7);
  if (city && (text.includes(city) || text.includes(city.replace(/\s+/g, "-")))) return true;
  if (phone.length === 7 && text.replace(/\D/g, "").includes(phone)) return true;
  return !!w.street && text.replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").includes(w.street);
}

/** The title names the business: its full name, or its Latin part. */
const names = (o: Organic, w: Who) => {
  const t = o.title || "";
  const latin = latinName(w.name);
  return mentions(t, w.name) || (latin.replace(/[^a-z]/gi, "").length >= 5 && mentions(t, latin));
};

const isYelpBiz = (o: Organic, w: Who) => host(o.link).endsWith("yelp.com") && path(o.link).startsWith("/biz/") && names(o, w) && local(o, w);
// A chain's one brand Page still counts as theirs; a loose (Latin-part) match must also be local.
const isFacebookPage = (o: Organic, w: Who) =>
  host(o.link).endsWith("facebook.com") &&
  !/^\/(groups|events|marketplace|watch|share|search|hashtag|public)\b/.test(path(o.link)) &&
  (mentions(o.title || "", w.name) || (names(o, w) && local(o, w)));
const isAppleMaps = (o: Organic, w: Who) => host(o.link) === "maps.apple.com" && names(o, w) && local(o, w);
const onDomain = (o: Organic, w: Who, domain: string) => host(o.link).endsWith(domain.toLowerCase()) && names(o, w) && local(o, w);

function who(name: string, address: string, phone?: string): Who {
  // "3473 Old Norcross Rd #100B, Duluth, GA 30096, USA"
  const parts = address.split(",").map((x) => x.trim());
  const city = parts.length >= 3 ? parts[parts.length - 3] : parts[0] || "";
  const m = address.match(/^\s*(\d+[a-z]?)\s+([a-z0-9]+(?:\s+[a-z0-9]+)?)/i);
  return { name, city: /\d/.test(city) ? "" : city, phone, street: m ? `${m[1]} ${m[2]}`.toLowerCase() : undefined };
}

const town = (address: string) => {
  // "3473 Old Norcross Rd #100B, Duluth, GA 30096, USA" -> "Duluth GA"
  const parts = address.split(",").map((x) => x.trim());
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
export async function ownerListings(name: string, address: string, domains: string[], phone?: string): Promise<SerperHit> {
  const w = who(name, address, phone);
  const q = `"${latinName(name)}" ${town(address)}`;
  const [yelp, fb, apple, dirs] = await Promise.all([
    safe(`site:yelp.com/biz ${q}`),
    safe(`site:facebook.com ${q}`),
    safe(`site:maps.apple.com ${q}`),
    domains.length ? safe(`${q} (${domains.map((d) => `site:${d}`).join(" OR ")})`) : Promise.resolve([] as Organic[]),
  ]);
  return {
    yelp: yelp && yelp.some((o) => isYelpBiz(o, w)) ? true : null,
    facebook: fb && fb.some((o) => isFacebookPage(o, w)) ? true : null,
    apple: apple && apple.some((o) => isAppleMaps(o, w)) ? true : null,
    others: dirs ? domains.filter((d) => dirs.some((o) => onDomain(o, w, d))) : null,
  };
}

/** A rival: one search for Yelp and Facebook together. */
export async function rivalListings(name: string, address: string, phone?: string): Promise<Pick<SerperHit, "yelp" | "facebook">> {
  const w = who(name, address, phone);
  const res = await safe(`${latinName(name)} ${town(address)} (site:yelp.com/biz OR site:facebook.com)`);
  return {
    yelp: res && res.some((o) => isYelpBiz(o, w)) ? true : null,
    facebook: res && res.some((o) => isFacebookPage(o, w)) ? true : null,
  };
}
