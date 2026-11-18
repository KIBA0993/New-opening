import "server-only";
import { directoriesFor } from "./directories";
import { has } from "./env";
import { getJSON, setJSON } from "./kv";
import { emptyProgress, type KitProgress, type StepCheck, type StepId } from "./kitSteps";
import { sameBrand } from "./providers/ai";
import { directoriesSafe } from "./providers/listings";
import { getPlace, searchBusinesses } from "./providers/places";
import { readProfileFacts, readSite, type ProfileFacts, type SiteFacts } from "./providers/profile";
import type { OwnerProfile, Place } from "./types";

// "Check my progress": re-reads the owner's public listings and website and ticks the Kit steps
// that are really done. About 3 cents a check: Google place details, one DataForSEO profile
// lookup (half a cent), one DataForSEO search for Yelp/Facebook/directories ($0.002) and two
// free fetches of their website. Apple, Bing and ChatGPT can't be checked from public data.

const key = (storeKey: string) => `kitp:${storeKey}`;

export async function loadProgress(storeKey: string): Promise<KitProgress> {
  return (await getJSON<KitProgress>(key(storeKey))) || emptyProgress();
}

export async function saveProgress(storeKey: string, p: KitProgress) {
  return setJSON(key(storeKey), p);
}

const digits = (s?: string) => (s || "").replace(/\D/g, "").slice(-10);

function step(found: string[], missing: string[], unknownWhenEmpty = false): StepCheck {
  if (!missing.length && !found.length && unknownWhenEmpty) return { state: "unknown", found, missing };
  return { state: missing.length ? "todo" : "done", found, missing };
}

/** Finds the owner's Google profile: by place id, or for a business that wasn't on Google yet, by name. */
async function findPlace(p: OwnerProfile): Promise<Place | null> {
  if (p.placeId && p.placeId !== "new") return getPlace(p.placeId);
  if (!has.places()) return null;
  const { places } = await searchBusinesses(`${p.name} ${p.address || p.city}`).catch(() => ({ places: [] as Place[] }));
  return places.find((x) => sameBrand(x.name, p.name)) || null;
}

export async function runCheck(p: OwnerProfile): Promise<{ at: string; steps: Partial<Record<StepId, StepCheck>>; placeId: string | null }> {
  const place = await findPlace(p);
  const website = p.website || place?.website;
  const phone = place?.phone || p.phone;
  const dirs = directoriesFor(p.industry);

  const [facts, site, listed] = await Promise.all([
    place && has.dataforseo() ? readProfileFacts(place.id).catch(() => null) : Promise.resolve(null as ProfileFacts | null),
    website ? readSite({ ...(place || { id: "new", name: p.name, address: p.address }), name: p.name, website, phone } as Place).catch(() => null) : Promise.resolve(null as SiteFacts | null),
    has.dataforseo() ? directoriesSafe(p.name, place?.address || p.address || p.city, place?.id, dirs.map((d) => d.domain)) : Promise.resolve(null),
  ]);

  const steps: Partial<Record<StepId, StepCheck>> = {};

  // Google profile
  if (!place) {
    steps.google = { state: "todo", found: [], missing: ["We couldn't find your Google profile yet. New profiles show up after Google verifies them."] };
    steps.verify = { state: "unknown", found: [], missing: [] };
  } else {
    const f: string[] = [], m: string[] = [];
    (place.hasHours ? f : m).push("Opening hours");
    (place.phone ? f : m).push("Phone number");
    (place.website ? f : m).push("Website link");
    if (facts) {
      (facts.description ? f : m).push("Business description");
      if (facts.extraCategories != null) (facts.extraCategories > 0 ? f : m).push("Secondary categories");
      if (facts.totalPhotos != null) (facts.totalPhotos >= 5 ? f : m).push(facts.totalPhotos >= 5 ? `${facts.totalPhotos} photos` : `At least 5 photos (you have ${facts.totalPhotos})`);
    }
    steps.google = step(f, m);
    steps.verify =
      facts?.claimed === true
        ? { state: "done", found: ["Google shows your profile as claimed by the owner"], missing: [] }
        : facts?.claimed === false
          ? { state: "todo", found: [], missing: ["Google still shows your profile as unclaimed"] }
          : { state: "unknown", found: [], missing: [] };
  }

  // Same details everywhere
  {
    const f: string[] = [], m: string[] = [];
    if (place && p.phone && place.phone) (digits(place.phone) === digits(p.phone) ? f : m).push(digits(place.phone) === digits(p.phone) ? "Google shows the same phone" : "Google shows a different phone than your Kit");
    if (site?.phone != null) (site.phone ? f : m).push(site.phone ? "Your website shows the same phone" : "Your website doesn't show the same phone as Google");
    if (site?.name === false) m.push("Your website doesn't show your business name as written");
    steps.details = step(f, m, true);
  }

  // Website
  if (!website) {
    steps.website = { state: "todo", found: [], missing: ["No website linked from your Google profile yet"] };
    steps.facts = { state: "unknown", found: [], missing: [] };
  } else if (!site) {
    steps.website = { state: "unknown", found: [], missing: ["We couldn't read your website just now"] };
    steps.facts = { state: "unknown", found: [], missing: [] };
  } else {
    const f: string[] = [], m: string[] = [];
    (site.servicePages >= 2 ? f : m).push(site.servicePages >= 2 ? `${site.servicePages} service pages` : `A page for each service (we found ${site.servicePages})`);
    (site.areaPage ? f : m).push("Areas you serve page");
    (site.schema ? f : m).push("Business schema");
    if (site.blocked) {
      const shut = Object.entries(site.blocked).filter(([, v]) => v).map(([k]) => ({ chatgpt: "ChatGPT", perplexity: "Perplexity", gemini: "Gemini" })[k]);
      (shut.length ? m : f).push(shut.length ? `Your robots.txt blocks ${shut.join(", ")}` : "AI assistants can read your site");
    }
    steps.website = step(f, m);
    const ff: string[] = [], fm: string[] = [];
    (site.credentials ? ff : fm).push("Licenses, insurance or certifications on your site");
    (site.prices ? ff : fm).push("Prices on your site");
    steps.facts = step(ff, fm);
  }

  // Yelp, Facebook, directories (one search; null = Google didn't show it, which isn't proof it's missing)
  if (listed) {
    steps.yelp = listed.yelp ? { state: "done", found: ["Your Yelp page shows up on Google"], missing: [] } : { state: "unknown", found: [], missing: ["We don't see your Yelp page on Google yet. New pages can take a few weeks."] };
    steps.facebook =
      listed.facebook === true
        ? { state: "done", found: ["Your Google profile links your Facebook page"], missing: [] }
        : listed.facebook === false
          ? { state: "todo", found: [], missing: ["Your Google profile doesn't link a Facebook page yet"] }
          : { state: "unknown", found: [], missing: [] };
    if (listed.others) {
      const on = dirs.filter((d) => listed.others!.includes(d.domain)).map((d) => d.name);
      const off = dirs.filter((d) => !listed.others!.includes(d.domain)).map((d) => d.name);
      steps.directories = on.length ? { state: on.length >= 2 ? "done" : "todo", found: on.map((n) => `On ${n}`), missing: on.length >= 2 ? [] : off.map((n) => `Not seen on ${n} yet`) } : { state: "unknown", found: [], missing: off.map((n) => `Not seen on ${n} yet`) };
    }
  }

  // Reviews
  if (place) {
    const n = place.reviewCount || 0;
    steps.reviews = n >= 10 ? { state: "done", found: [`${n} Google reviews`], missing: [] } : { state: "todo", found: n ? [`${n} Google reviews so far`] : [], missing: [`${10 - n} more to reach 10`] };
  }

  return { at: new Date().toISOString(), steps, placeId: place?.id || null };
}

/** Runs a check and saves it with the owner's ticks. */
export async function checkAndSave(storeKey: string, p: OwnerProfile): Promise<KitProgress> {
  const [prev, res] = await Promise.all([loadProgress(storeKey), runCheck(p)]);
  const next: KitProgress = { manual: prev.manual, check: { at: res.at, steps: res.steps } };
  await saveProgress(storeKey, next);
  return next;
}
