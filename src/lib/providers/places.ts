import "server-only";
import { env, has } from "../env";
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
    website: p.websiteUri,
    rating: p.rating,
    reviewCount: p.userRatingCount ?? 0,
    primaryType: p.primaryType,
    primaryTypeLabel: p.primaryTypeDisplayName?.text,
    types: p.types,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    photoName: p.photos?.[0]?.name,
    mapsUrl: p.googleMapsUri,
    status: p.businessStatus,
  };
}

async function gpost<T>(path: string, body: unknown, fields: string): Promise<T> {
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
export async function searchBusinesses(q: string): Promise<{ places: Place[]; demo: boolean }> {
  if (!has.places()) return { places: mockSearch(q), demo: true };

  if (looksLikePhone(q)) {
    // The newer API has no phone lookup, so use the older Find Place endpoint for IDs.
    const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
    url.searchParams.set("input", e164(q));
    url.searchParams.set("inputtype", "phonenumber");
    url.searchParams.set("fields", "place_id");
    url.searchParams.set("key", env.googlePlaces);
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as { candidates?: { place_id: string }[] };
    const ids = (data.candidates || []).slice(0, 5).map((c) => c.place_id);
    const places = await Promise.all(ids.map((id) => getPlace(id)));
    return { places: places.filter(Boolean) as Place[], demo: false };
  }

  const data = await gpost<{ places?: GPlace[] }>(
    "places:searchText",
    { textQuery: q, pageSize: 6 },
    FIELDS.map((f) => `places.${f}`).join(","),
  );
  return { places: (data.places || []).map(toPlace), demo: false };
}

export async function autocomplete(input: string, sessionToken: string) {
  if (!has.places()) {
    return mockSearch(input).slice(0, 1).map((p) => ({ placeId: p.id, main: p.name, secondary: p.address }));
  }
  const data = await gpost<{
    suggestions?: { placePrediction?: { placeId: string; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[];
  }>("places:autocomplete", { input, sessionToken, includedRegionCodes: ["us"] }, "*");
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

export async function getPlace(id: string, sessionToken?: string): Promise<Place | null> {
  if (id.startsWith("demo_") || !has.places()) return mockPlace(id);
  const url = new URL(`${BASE}/places/${encodeURIComponent(id)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": env.googlePlaces, "X-Goog-FieldMask": FIELDS.join(",") },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return toPlace((await res.json()) as GPlace);
}

function milesBetween(a: { lat?: number; lng?: number }, b: { lat?: number; lng?: number }) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return undefined;
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

/** Top 5 nearby businesses of the same kind, by rating and reviews. */
export async function findRivals(
  place: Place,
  industry: IndustrySlug,
  term: string,
): Promise<{ rivals: (Place & { distanceMiles?: number })[]; demo: boolean }> {
  if (!has.places() || place.id.startsWith("demo_") || place.lat == null) {
    const rivals = mockRivals(industry, place.name).map((r) => ({ ...r, distanceMiles: milesBetween(place, r) }));
    return { rivals, demo: true };
  }
  const center = { latitude: place.lat, longitude: place.lng };
  const fields = FIELDS.map((f) => `places.${f}`).join(",");
  let found: GPlace[] = [];
  if (place.primaryType) {
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
      { textQuery: term, pageSize: 20, locationBias: { circle: { center, radius: 4800 } } },
      fields,
    );
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
