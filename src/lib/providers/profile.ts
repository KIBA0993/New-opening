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

export function profileFacts(place: Place): Promise<ProfileFacts | null> {
  if (!has.dataforseo() || place.id === "new" || place.id.startsWith("demo_")) return Promise.resolve(null);
  return unstable_cache(
    async () => {
      const r = await dfs<{ items?: InfoItem[] }>("business_data/google/my_business_info/live", { keyword: `place_id:${place.id}`, language_code: "en", location_code: 2840 });
      const it = r?.items?.[0];
      if (!it) return null;
      return {
        description: it.description?.trim() || null,
        totalPhotos: typeof it.total_photos === "number" ? it.total_photos : null,
        claimed: typeof it.is_claimed === "boolean" ? it.is_claimed : null,
        extraCategories: Array.isArray(it.additional_categories) ? it.additional_categories.length : null,
      };
    },
    ["profile-facts-v1", place.id],
    { revalidate: 60 * 60 * 24 * 7 },
  )().catch((e) => {
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

/** Does the business's website show the same phone number as Google? null when we can't tell. */
export function websiteMatches(place: Place): Promise<{ phone: boolean | null; name: boolean | null } | null> {
  const want = (place.phone || "").replace(/\D/g, "").slice(-10);
  if (!place.website || place.id.startsWith("demo_")) return Promise.resolve(null);
  return unstable_cache(
    async () => {
      const res = await fetch(place.website!, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MapDebutCheck/1.0; +https://mapdebut.com)" },
        signal: AbortSignal.timeout(6000),
        redirect: "follow",
      });
      if (!res.ok || !(res.headers.get("content-type") || "").includes("html")) return null;
      const html = (await res.text()).slice(0, 600_000);
      const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ");
      const digits = text.replace(/\D/g, "");
      const words = place.name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2).slice(0, 2);
      return {
        phone: want.length === 10 ? digits.includes(want) || digits.includes("1" + want) : null,
        name: words.length ? words.every((w) => text.toLowerCase().includes(w)) : null,
      };
    },
    ["site-match-v1", place.id, place.website, want],
    { revalidate: 60 * 60 * 24 * 7 },
  )().catch(() => null);
}
