import "server-only";
import { cleanUrl } from "../url";
import { unstable_cache } from "next/cache";
import { nearBias, type LatLng } from "../geo";
import { env, has } from "../env";
import { spend } from "../guard";
import { isGenericLabel } from "../industries";
import { mockPlace, mockRivals, mockSearch } from "../mock";
import type { IndustrySlug, Place } from "../types";

// Google Places API (New). Docs: https://developers.google.com/maps/documentation/places/web-service
// Google's terms only allow caching the place ID, so we always fetch details fresh.

const BASE = "https://places.googleapis.com/v1";
const FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "addressComponents",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "location",
  "photos",
  "googleMapsUri",
  "businessStatus",
  "regularOpeningHours",
];

interface GPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
  types?: string[];
  location?: { latitude: number; longitude: number };
  photos?: { name: string }[];
  googleMapsUri?: string;
  businessStatus?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

function cityFrom(p: GPlace): string | undefined {
  const comps = p.addressComponents || [];
  const city = comps.find((c) => c.types.includes("locality"))?.longText ||
    comps.find((c) => c.types.includes("sublocality"))?.longText ||
    comps.find((c) => c.types.includes("administrative_area_level_2"))?.longText;
  const state = comps.find((c) => c.types.includes("administrative_area_level_1"))?.shortText;
  if (!city) return undefined;
  return state ? `${city}, ${state}` : city;
}

function toPlace(p: GPlace): Place {
  return {
    id: p.id,
    name: p.displayName?.text || "Unnamed business",
    address: p.formattedAddress || "",
    city: cityFrom(p),
    phone: p.nationalPhoneNumber,
    website: cleanUrl(p.websiteUri),
    rating: p.rating,
    reviewCount: p.userRatingCount ?? 0,
    primaryType: p.primaryType,
    primaryTypeLabel: p.primaryTypeDisplayName?.text,
    types: p.types,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    photoName: p.photos?.[0]?.name,
    hasHours: !!p.regularOpeningHours?.weekdayDescriptions?.length,
    mapsUrl: p.googleMapsUri,
    status: p.businessStatus,
    // Google gives no location for service-area businesses that hide their address.
    serviceArea: !p.location || undefined,
  };
}

async function gpost<T>(path: string, body: unknown, fields: string): Promise<T> {
  await spend("places");
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlaces,
      "X-Goog-FieldMask": fields,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Places ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function looksLikePhone(q: string) {
  const digits = q.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 && /^[\d\s()+.-]+$/.test(q.trim());
}

function e164(q: string) {
  const d = q.replace(/\D/g, "");
  if (q.trim().startsWith("+")) return `+${d}`;
  return d.length === 10 ? `+1${d}` : `+${d}`;
}

/** One box: name, address or phone. */
/** Older Find Place endpoint. Returns null when the project doesn't have the older Places API turned on. */
async function findByPhoneLegacy(q: string): Promise<Place[] | null> {
  await spend("places");
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", e164(q));
  url.searchParams.set("inputtype", "phonenumber");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", env.googlePlaces);
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as { status?: string; candidates?: { place_id: string }[] };
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") return null;
  const ids = (data.candidates || []).slice(0, 5).map((c) => c.place_id);
  const places = await Promise.all(ids.map((id) => getPlace(id)));
  return places.filter(Boolean) as Place[];
}

export async function searchBusinesses(q: string, near: LatLng | null = null): Promise<{ places: Place[]; demo: boolean }> {
  if (!has.places()) return { places: mockSearch(q), demo: true };

  if (looksLikePhone(q)) {
    // Google no longer lets new projects turn on the older Places API, so the phone lookup
    // uses it only when it's available and otherwise searches the newer API by phone number.
    const legacy = await findByPhoneLegacy(q).catch(() => null);
    if (legacy?.length) return { places: legacy, demo: false };
    const data = await gpost<{ places?: GPlace[] }>(
      "places:searchText",
      { textQuery: e164(q), pageSize: 10, regionCode: "us", includePureServiceAreaBusinesses: true },
      FIELDS.map((f) => `places.${f}`).join(","),
    );
    const all = (data.places || []).map(toPlace);
    const want = q.replace(/\D/g, "").slice(-10);
    const exact = all.filter((pl) => (pl.phone || "").replace(/\D/g, "").slice(-10) === want);
    return { places: (exact.length ? exact : all).slice(0, 5), demo: false };
  }

  const data = await gpost<{ places?: GPlace[] }>(
    "places:searchText",
    // Service-area businesses (mobile groomers, cleaners, coaches) hide their address; Google leaves them out unless asked.
    { textQuery: q, pageSize: 6, includePureServiceAreaBusinesses: true, ...nearBias(near) },
    FIELDS.map((f) => `places.${f}`).join(","),
  );
  const places = (data.places || []).map(toPlace);
  return { places: await swapClosed(places), demo: false };
}

/**
 * An old listing Google marks permanently closed often outranks the owner's live one, which may hide
 * its address. Look the closed one's phone number up and show the open listing that shares it instead.
 */
async function swapClosed(places: Place[]): Promise<Place[]> {
  const closed = places.filter((p) => p.status === "CLOSED_PERMANENTLY");
  if (!closed.length) return places;
  const phones = [...new Set(closed.map((p) => (p.phone || "").replace(/\D/g, "").slice(-10)).filter((d) => d.length === 10))].slice(0, 2);
  const found: Place[] = [];
  for (const digits of phones) {
    const data = await gpost<{ places?: GPlace[] }>(
      "places:searchText",
      { textQuery: e164(digits), pageSize: 5, regionCode: "us", includePureServiceAreaBusinesses: true },
      FIELDS.map((f) => `places.${f}`).join(","),
    ).catch(() => ({ places: [] as GPlace[] }));
    found.push(...(data.places || []).map(toPlace).filter((p) => p.status !== "CLOSED_PERMANENTLY" && (p.phone || "").replace(/\D/g, "").slice(-10) === digits));
  }
  const open = places.filter((p) => p.status !== "CLOSED_PERMANENTLY");
  const extra = found.filter((f) => !open.some((p) => p.id === f.id));
  // Open listings first; keep the closed ones last so an owner can still see and pick them.
  return [...extra, ...open, ...closed].slice(0, 6);
}

export async function autocomplete(input: string, sessionToken: string, near: LatLng | null = null) {
  if (!has.places()) {
    return mockSearch(input).slice(0, 1).map((p) => ({ placeId: p.id, main: p.name, secondary: p.address }));
  }
  const data = await gpost<{
    suggestions?: { placePrediction?: { placeId: string; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[];
  }>("places:autocomplete", { input, sessionToken, includedRegionCodes: ["us"], includePureServiceAreaBusinesses: true, ...nearBias(near), ...(near ? { origin: near } : {}) }, "*");
  return (data.suggestions || [])
    .map((s) => s.placePrediction)
    .filter(Boolean)
    .slice(0, 5)
    .map((p) => ({
      placeId: p!.placeId,
      main: p!.structuredFormat?.mainText?.text || "",
      secondary: p!.structuredFormat?.secondaryText?.text || "",
    }));
}

// Google's details and rival lists are kept for 30 minutes, so refreshes, back-and-forth clicks and
// the several parts of one report don't each pay for the same lookup. Google's terms don't allow
// keeping Places content for long, so this stays short. Failed lookups aren't kept.
const HOLD = 60 * 30;

class Miss extends Error {}

const heldPlace = unstable_cache(
  async (id: string) => {
    const p = await fetchPlace(id);
    if (!p) throw new Miss();
    return p;
  },
  ["place-v1"],
  { revalidate: HOLD },
);

/** Place details. With a session token (the search box flow) it always asks Google, so the session bills as one. */
export async function getPlace(id: string, sessionToken?: string): Promise<Place | null> {
  if (id.startsWith("demo_") || !has.places()) return mockPlace(id);
  if (sessionToken) return fetchPlace(id, sessionToken);
  return heldPlace(id).catch(() => null);
}

async function fetchPlace(id: string, sessionToken?: string): Promise<Place | null> {
  try {
    await spend("places");
  } catch {
    return null;
  }
  const url = new URL(`${BASE}/places/${encodeURIComponent(id)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": env.googlePlaces, "X-Goog-FieldMask": FIELDS.join(",") },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return toPlace((await res.json()) as GPlace);
}

const heldTown = unstable_cache(
  async (town: string) => {
    const data = await gpost<{ places?: GPlace[] }>(
      "places:searchText",
      { textQuery: town, pageSize: 1, regionCode: "us" },
      "places.location,places.addressComponents,places.formattedAddress",
    );
    const hit = data.places?.[0];
    if (!hit?.location) throw new Miss();
    return { city: cityFrom(hit as GPlace) || town, lat: hit.location.latitude, lng: hit.location.longitude };
  },
  ["town-v1"],
  { revalidate: HOLD },
);

/**
 * A service-area business that hides its address has no location on Google, so rivals, AI questions
 * and the Maps grid have nothing to center on. The owner tells us the town they serve; this places
 * the business at that town's center. Businesses with a real location are returned unchanged.
 */
export async function locateTown(place: Place, town?: string | null): Promise<Place> {
  const t = (town || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (place.lat != null || !t || !has.places() || place.id === "new" || place.id.startsWith("demo_")) return place;
  const found = await heldTown(t.toLowerCase()).catch(() => null);
  if (!found) return place;
  return { ...place, city: found.city, lat: found.lat, lng: found.lng, serviceArea: true };
}

function milesBetween(a: { lat?: number; lng?: number }, b: { lat?: number; lng?: number }) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return undefined;
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

type Rivals = { rivals: (Place & { distanceMiles?: number })[]; demo: boolean };

/** Top 5 nearby businesses of the same kind, by rating and reviews. Kept 30 minutes per business and search. */
export function findRivals(place: Place, industry: IndustrySlug, term: string): Promise<Rivals> {
  if (!has.places() || place.id.startsWith("demo_") || place.id === "new" || place.lat == null) return fetchRivals(place, industry, term);
  return unstable_cache(() => fetchRivals(place, industry, term), ["rivals-v1", place.id, industry, term], { revalidate: HOLD })();
}

async function fetchRivals(place: Place, industry: IndustrySlug, term: string): Promise<Rivals> {
  if (!has.places() || place.id.startsWith("demo_") || place.lat == null) {
    const rivals = mockRivals(industry, place.name).map((r) => ({ ...r, distanceMiles: milesBetween(place, r) }));
    return { rivals, demo: true };
  }
  const center = { latitude: place.lat, longitude: place.lng };
  const fields = FIELDS.map((f) => `places.${f}`).join(",");
  let found: GPlace[] = [];
  // A catch-all type ("Health", "Medical clinic" for a coach) would pull in the wrong kind of business,
  // so those search by what the business really does instead.
  if (place.primaryType && !(place.ownerTerm || place.termHint || (industry === "wellness" && isGenericLabel(place.primaryTypeLabel)))) {
    const data = await gpost<{ places?: GPlace[] }>(
      "places:searchNearby",
      {
        includedPrimaryTypes: [place.primaryType],
        maxResultCount: 20,
        rankPreference: "POPULARITY",
        locationRestriction: { circle: { center, radius: 4800 } }, // about 3 miles
      },
      fields,
    ).catch(() => ({ places: [] as GPlace[] }));
    found = data.places || [];
  }
  if (found.length < 5) {
    // Fall back to a text search ("nail salon") biased around the business.
    const data = await gpost<{ places?: GPlace[] }>(
      "places:searchText",
      // Rivals that hide their address (coaches, mobile groomers) count too.
      { textQuery: term, pageSize: 20, includePureServiceAreaBusinesses: true, locationBias: { circle: { center, radius: 4800 } } },
      fields,
    ).catch((e) => {
      // Keep the nearby results we already have; with none, let the caller handle it.
      if (found.length) return { places: [] as GPlace[] };
      throw e;
    });
    found = [...found, ...(data.places || [])];
  }
  const seen = new Set<string>([place.id]);
  const rivals = found
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map(toPlace)
    .map((r) => ({ ...r, distanceMiles: milesBetween(place, r) }))
    .filter((r) => r.distanceMiles == null || r.distanceMiles <= 5)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5);
  return { rivals, demo: false };
}

const score = (p: Place) => (p.rating || 0) * Math.log10((p.reviewCount || 0) + 1);

export function reviewLink(placeId: string) {
  if (placeId.startsWith("demo_") || placeId === "new") return "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID";
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/** Up to 5 of the newest reviews Google shares publicly, for drafting replies. */
export async function latestReviews(placeId: string): Promise<{ author: string; rating: number; text: string; when: string }[]> {
  if (!has.places() || placeId.startsWith("demo_") || placeId === "new") return [];
  try {
    await spend("places");
  } catch {
    return [];
  }
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": env.googlePlaces, "X-Goog-FieldMask": "reviews" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    reviews?: { rating: number; text?: { text: string }; authorAttribution?: { displayName: string }; relativePublishTimeDescription?: string; publishTime?: string }[];
  };
  return (data.reviews || [])
    .filter((r) => r.publishTime && Date.now() - new Date(r.publishTime).getTime() < 14 * 864e5)
    .map((r) => ({
      author: r.authorAttribution?.displayName || "A customer",
      rating: r.rating,
      text: r.text?.text || "",
      when: r.relativePublishTimeDescription || "",
    }));
}

/** How recent the newest reviews Google shows are. Held 30 minutes like other place details. */
export interface ReviewFreshness {
  newestDays: number | null; // age of the newest review Google shows, in days
  last30: number; // of the reviews Google shows (up to 5), how many are from the last 30 days
  texts?: string[]; // the review texts Google shows (up to 5)
}

export function reviewFreshness(placeId: string): Promise<ReviewFreshness | null> {
  if (!has.places() || placeId.startsWith("demo_") || placeId === "new") return Promise.resolve(null);
  return unstable_cache(
    async () => {
      await spend("places");
      const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
        headers: { "X-Goog-Api-Key": env.googlePlaces, "X-Goog-FieldMask": "reviews.publishTime,reviews.text" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`reviews ${res.status}`);
      const data = (await res.json()) as { reviews?: { publishTime?: string; text?: { text?: string } }[] };
      const ages = (data.reviews || []).map((r) => (r.publishTime ? (Date.now() - new Date(r.publishTime).getTime()) / 864e5 : Infinity)).filter(Number.isFinite);
      const texts = (data.reviews || []).map((r) => r.text?.text || "").filter(Boolean);
      return { newestDays: ages.length ? Math.floor(Math.min(...ages)) : null, last30: ages.filter((a) => a <= 30).length, texts };
    },
    ["review-fresh-v2", placeId],
    { revalidate: HOLD },
  )().catch(() => null);
}
