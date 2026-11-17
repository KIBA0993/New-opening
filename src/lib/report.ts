import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { has } from "./env";
import { buildPrompts, industryBySlug, searchTerm } from "./industries";
import { seeded } from "./mock";
import { cachedAsk, checkEngines, excerptAround, mentions, searchJSON } from "./providers/ai";
import { findRivals } from "./providers/places";
import type { Engine, EngineAnswer, IndustrySlug, ListingCheck, Place, Platform, Rival } from "./types";

export const PLATFORM_LABEL: Record<Platform, string> = {
  google: "Google Maps",
  apple: "Apple Maps",
  bing: "Bing Places",
  yelp: "Yelp",
  facebook: "Facebook",
  chatgpt: "ChatGPT",
};

export type Light = "green" | "yellow" | "red";

// The free check asks about 3 questions in total: 1 per engine with 3 engines, all 3 with 1 engine.
const FREE_QUESTIONS = 3;

export function checkContext(place: Place, industrySlug: IndustrySlug) {
  const industry = industryBySlug(industrySlug)!;
  const term = searchTerm(industry, place.primaryTypeLabel);
  const area = place.city || place.address;
  return { industry, term, area, isNew: place.id === "new" };
}

/** Nearby rivals, fetched once per request (both report sections need them). */
export const getRivals = cache(async (place: Place, industrySlug: IndustrySlug) => {
  const { term, area } = checkContext(place, industrySlug);
  return findRivals(place, industrySlug, `${term} near ${area}`);
});

// ---------- 1) Instant signals: no AI, about 2 seconds ----------

export interface Signal {
  label: string;
  light: Light;
  note: string;
}

export function signals(place: Place, rivals: Place[]): { items: Signal[]; score: number } {
  const isNew = place.id === "new";
  const reviews = place.reviewCount || 0;
  const rivalCounts = rivals.map((r) => r.reviewCount || 0).sort((a, b) => a - b);
  const median = rivalCounts.length ? rivalCounts[Math.floor(rivalCounts.length / 2)] : 0;
  const items: Signal[] = [
    isNew
      ? { label: "On Google Maps", light: "red", note: "Not on Google yet. Every AI tool checks Google first." }
      : { label: "On Google Maps", light: "green", note: "Your profile is live." },
    {
      label: "Clear business category",
      light: isNew ? "red" : place.primaryType ? "green" : "yellow",
      note: place.primaryTypeLabel ? `Listed as "${place.primaryTypeLabel}".` : "AI tools match you to searches by category. Pick the most specific one.",
    },
    { label: "Opening hours", light: place.hasHours ? "green" : "red", note: place.hasHours ? "Hours are listed." : "No hours listed. AI tools skip businesses that might be closed." },
    { label: "Phone number", light: place.phone ? "green" : "red", note: place.phone ? "Listed." : "Add a local phone number." },
    { label: "Website", light: place.website ? "green" : "yellow", note: place.website ? "Listed." : "Not required, but AI tools trust businesses with a site." },
    { label: "Photos", light: place.photoName ? "green" : "yellow", note: place.photoName ? "You have photos." : "Add at least 5 photos of your work or space." },
    {
      label: "Reviews vs. nearby rivals",
      light: reviews >= median ? "green" : reviews >= median / 3 ? "yellow" : "red",
      note: `You have ${reviews}. Your typical rival has ${median}.`,
    },
    {
      label: "Rating",
      light: !place.rating ? "yellow" : place.rating >= 4.5 ? "green" : place.rating >= 4 ? "yellow" : "red",
      note: place.rating ? `${place.rating} stars.` : "No rating yet. Your first 10 reviews matter most.",
    },
  ];
  const points = items.reduce((n, s) => n + (s.light === "green" ? 1 : s.light === "yellow" ? 0.5 : 0), 0);
  return { items, score: Math.round((points / items.length) * 100) };
}

// ---------- 2) Real AI answers, cached by question ----------

async function runAnswers(placeName: string, rivalNames: string[], prompts: string[], area: string): Promise<{ answers: EngineAnswer[]; demo: boolean }> {
  const { engines, demo } = checkEngines();
  if (demo) return { answers: mockAnswers(placeName, rivalNames, prompts, engines), demo: true };
  const perEngine = Math.max(1, Math.ceil(FREE_QUESTIONS / engines.length));
  const jobs = engines.flatMap((engine) => prompts.slice(0, perEngine).map((prompt) => ({ engine, prompt })));
  const answers = await Promise.all(
    jobs.map(async ({ engine, prompt }): Promise<EngineAnswer | null> => {
      try {
        const text = await cachedAsk(engine, prompt, area);
        const mentionsYou = mentions(text, placeName);
        const named = rivalNames.filter((r) => mentions(text, r));
        return { engine, prompt, mentionsYou, rivalsMentioned: named, excerpt: excerptAround(text, mentionsYou ? placeName : named[0] || "") };
      } catch (e) {
        console.error("engine failed", engine, e);
        return null;
      }
    }),
  );
  return { answers: answers.filter(Boolean) as EngineAnswer[], demo: false };
}

function mockAnswers(placeName: string, rivalNames: string[], prompts: string[], engines: Engine[]): EngineAnswer[] {
  const r = seeded(placeName);
  return engines.map((engine, i) => {
    const prompt = prompts[i % prompts.length];
    const picks = rivalNames.filter(() => r() > 0.45).slice(0, 3);
    const rivalsMentioned = picks.length ? picks : rivalNames.slice(0, 2);
    const mentionsYou = engine === "perplexity";
    return {
      engine,
      prompt,
      mentionsYou,
      rivalsMentioned,
      excerpt: `Here are a few well-reviewed options: ${rivalsMentioned.join(", ")}${mentionsYou ? `, and ${placeName}, which opened recently` : ""}.`,
    };
  });
}

// ---------- 3) Listings everywhere else (per business, cached a day) ----------

interface ScanResult {
  [k: string]: { found: boolean | null; url?: string; phone?: string; address?: string; note?: string } | undefined;
}

const digits = (s?: string) => (s || "").replace(/\D/g, "").slice(-10);

async function scanListings(place: Place, isNew: boolean, area: string): Promise<{ listings: ListingCheck[]; demo: boolean }> {
  const google: ListingCheck = isNew
    ? { platform: "google", state: "missing", note: "Not on Google yet. This is step one." }
    : { platform: "google", state: "found", note: "Found on Google Maps.", url: place.mapsUrl };
  const chatgpt: ListingCheck = {
    platform: "chatgpt",
    state: "unknown",
    note: "ChatGPT's new business profiles can't be checked from outside yet. Claim yours to be safe.",
  };

  if (!has.webSearch()) {
    return {
      demo: true,
      listings: [
        google,
        { platform: "yelp", state: "missing", note: "No Yelp page found. AI tools quote Yelp more than any other directory." },
        { platform: "apple", state: "missing", note: "Not on Apple Maps. iPhone users won't see you in Maps or Siri." },
        { platform: "bing", state: "different", note: "Bing shows an old phone number. Bing feeds ChatGPT's search, so fix it." },
        { platform: "facebook", state: "found", note: "Facebook page found." },
        chatgpt,
      ],
    };
  }

  const prompt = `Find the online listings for this local business:
Name: ${place.name}
Address: ${place.address || place.city}
Phone: ${place.phone || "unknown"}

For each platform (yelp, apple, bing, facebook), check whether a listing for this exact business exists.
Return JSON like {"yelp":{"found":true,"url":"...","phone":"...","address":"...","note":"..."},"apple":{...},"bing":{...},"facebook":{...}}.
Use found:null when you can't tell. Apple Maps listings are often not visible on the web, so use null rather than false unless you're sure.`;
  const scan = (await searchJSON<ScanResult>(prompt, area)) || {};
  const label: Record<string, string> = { yelp: "Yelp", apple: "Apple Maps", bing: "Bing", facebook: "Facebook" };
  const rows: ListingCheck[] = (["yelp", "apple", "bing", "facebook"] as Platform[]).map((p) => {
    const s = scan[p];
    if (!s || s.found == null) return { platform: p, state: "unknown", note: `We couldn't confirm a ${label[p]} listing. Worth a quick look.` };
    if (!s.found) return { platform: p, state: "missing", note: `No ${label[p]} listing found.` };
    const phoneDiff = s.phone && place.phone && digits(s.phone) !== digits(place.phone);
    if (phoneDiff) return { platform: p, state: "different", url: s.url, note: `${label[p]} shows a different phone number (${s.phone}).` };
    return { platform: p, state: "found", url: s.url, note: `Found on ${label[p]}.` };
  });
  return { listings: [google, ...rows, chatgpt], demo: false };
}

async function rivalProfiles(rivals: Place[], area: string): Promise<Record<string, Partial<Record<Platform, boolean>>>> {
  if (!rivals.length) return {};
  if (!has.webSearch()) {
    const r = seeded(rivals.map((x) => x.name).join());
    return Object.fromEntries(rivals.map((x) => [x.name, { google: true, yelp: r() > 0.2, apple: r() > 0.4, bing: r() > 0.5, facebook: r() > 0.3 }]));
  }
  const prompt = `For each of these local businesses in ${area}, say whether they have a Yelp page, an Apple Maps listing, a Bing Places listing and a Facebook page.
${rivals.map((r) => `- ${r.name} (${r.address})`).join("\n")}
Return JSON: {"<exact business name>": {"yelp": true|false|null, "apple": true|false|null, "bing": true|false|null, "facebook": true|false|null}}`;
  const out = (await searchJSON<Record<string, Partial<Record<Platform, boolean | null>>>>(prompt, area)) || {};
  return Object.fromEntries(
    rivals.map((r) => {
      const row = out[r.name] || {};
      return [r.name, { google: true, yelp: !!row.yelp, apple: !!row.apple, bing: !!row.bing, facebook: !!row.facebook }];
    }),
  );
}

const cachedListings = unstable_cache(
  async (placeKey: string, place: Place, isNew: boolean, rivals: Place[], area: string) => {
    void placeKey;
    const [scan, profiles] = await Promise.all([scanListings(place, isNew, area), rivalProfiles(rivals, area)]);
    return { listings: scan.listings, demo: scan.demo, profiles };
  },
  ["listings-v2"],
  { revalidate: 60 * 60 * 24 },
);

export async function aiReport(place: Place, industrySlug: IndustrySlug) {
  const { industry, term, area, isNew } = checkContext(place, industrySlug);
  const { rivals: rivalPlaces, demo: rivalsDemo } = await getRivals(place, industrySlug);
  const prompts = buildPrompts(industry, term, area);
  const [ans, lst] = await Promise.all([
    runAnswers(place.name, rivalPlaces.map((r) => r.name), prompts, area),
    cachedListings(`${place.id}|${place.name}`, place, isNew, rivalPlaces, area),
  ]);
  const rivals: Rival[] = rivalPlaces.map((r) => ({
    ...r,
    aiMentions: ans.answers.filter((a) => a.rivalsMentioned.includes(r.name)).length,
    profiles: lst.profiles[r.name],
  }));
  return {
    answers: ans.answers,
    listings: lst.listings,
    rivals,
    demo: ans.demo || lst.demo || rivalsDemo || place.id.startsWith("demo_"),
  };
}

export function aiSummary(answers: EngineAnswer[], rivals: Rival[]) {
  const total = answers.length || 1;
  const named = answers.filter((a) => a.mentionsYou).length;
  const topRivals = [...rivals].sort((a, b) => b.aiMentions - a.aiMentions).filter((r) => r.aiMentions > 0).slice(0, 3);
  const light: Light = named / total >= 0.5 ? "green" : named > 0 ? "yellow" : "red";
  let headline: string;
  if (named === 0 && topRivals.length) headline = `AI recommends ${topRivals.length === 1 ? topRivals[0].name : `these ${topRivals.length} rivals`}, not you.`;
  else if (named === 0) headline = "AI assistants don't recommend you yet.";
  else headline = `AI named you in ${named} of ${total} answers. Let's make it every time.`;
  return { named, total, topRivals, light, headline };
}

export function nextFix(sig: Signal[], listings: ListingCheck[]) {
  if (listings[0]?.state === "missing") return "Create your Google profile";
  const red = sig.find((s) => s.light === "red");
  if (red) return `Fix this next: ${red.label.toLowerCase()}`;
  const diff = listings.find((l) => l.state === "different");
  if (diff) return `Fix the wrong details on ${PLATFORM_LABEL[diff.platform]}`;
  const missing = listings.find((l) => l.state === "missing");
  if (missing) return `Get listed on ${PLATFORM_LABEL[missing.platform]}`;
  return "Claim your ChatGPT business profile";
}
