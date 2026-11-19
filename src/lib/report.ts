import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { alertOwner, errText } from "./alert";
import { has } from "./env";
import { buildPrompts, industryBySlug, searchTerm } from "./industries";
import { seeded } from "./mock";
import { askEngineFull, cachedAskFree, checkEngines, ENGINE_LABEL, excerptAround, mentions, picksIn, sameBrand, searchJSON } from "./providers/ai";
import { directoriesSafe, type DirectoryHit } from "./providers/listings";
import { nearbyPhotos, profileFacts, siteFacts, websiteMatches, type ProfileFacts, type SiteFacts } from "./providers/profile";
import { directoriesFor } from "./directories";
import { reviewFreshness, type ReviewFreshness } from "./providers/places";
import { findRivals } from "./providers/places";
import { dataforseoReady } from "./providers/dfs";
import { hasSerper, ownerListings, rivalListings } from "./providers/serper";
import type { Engine, EngineAnswer, Placement, IndustrySlug, ListingCheck, Place, Platform, Rival } from "./types";

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
  const term = searchTerm(industry, place.primaryTypeLabel, place);
  const area = place.city || place.address;
  return { industry, term, area, isNew: place.id === "new" };
}

/** Nearby rivals, fetched once per request (both report sections need them). */
export const getRivals = cache(async (place: Place, industrySlug: IndustrySlug) => {
  const { term, area } = checkContext(place, industrySlug);
  let found: Awaited<ReturnType<typeof findRivals>>;
  try {
    found = await findRivals(place, industrySlug, `${term} near ${area}`);
  } catch (e) {
    // Without rivals the check still works (it just has no one to compare against). Failing here
    // used to take down every section of the report. Not cached, so the next load tries again.
    await alertOwner("rivals", "The free check couldn't load nearby rivals", { business: place.name, place: place.id, industry: industrySlug, error: errText(e) });
    found = { rivals: [], demo: false };
  }
  // The owner's other locations aren't rivals; a mention of their brand already counts as a win.
  return { ...found, rivals: found.rivals.filter((r) => r.id !== place.id && !sameBrand(r.name, place.name)) };
});

// ---------- 1) Instant signals: no AI, about 2 seconds ----------

export interface Signal {
  label: string;
  light: Light;
  note: string;
}

/** Extra facts the graded score uses when we have them. Any can be missing; missing ones don't count against you. */
export interface ReadinessExtras {
  profile?: ProfileFacts | null;
  fresh?: ReviewFreshness | null;
  rivalPhotos?: number[]; // total photos of nearby rivals
  site?: { phone: boolean | null; name: boolean | null } | null;
}

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const upper = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.75))] : 0;
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Graded AI readiness score. Each signal earns 0 to 1 point times its weight, so "has photos"
 * isn't enough: you need about as many as your strongest rivals, recent reviews, a written
 * description and details that match everywhere. A strong, established business typically
 * lands around 70 to 85.
 */
export function signals(place: Place, rivals: Place[], x: ReadinessExtras = {}): { items: Signal[]; score: number } {
  const isNew = place.id === "new";
  const reviews = place.reviewCount || 0;
  const rivalReviews = rivals.map((r) => r.reviewCount || 0);
  const rows: { label: string; weight: number; points: number | null; note: string }[] = [];
  const add = (label: string, weight: number, points: number | null, note: string) => rows.push({ label, weight, points: points == null ? null : clamp(points), note });

  add("On Google Maps", 2, isNew ? 0 : 1, isNew ? "Not on Google yet. Every AI tool checks Google first." : "Your profile is live.");
  if (x.profile?.claimed != null || isNew) {
    add("Profile claimed by you", 2, x.profile?.claimed ? 1 : 0, x.profile?.claimed ? "You manage this profile." : "Unclaimed. Anyone can suggest edits, and Google trusts it less. Claim and verify it.");
  }
  const extra = x.profile?.extraCategories;
  add(
    "Categories",
    1,
    isNew ? 0 : !place.primaryType ? 0.4 : extra == null ? 0.8 : extra >= 2 ? 1 : extra === 1 ? 0.8 : 0.6,
    place.primaryTypeLabel
      ? `Main category "${place.primaryTypeLabel}"${extra != null ? `, plus ${extra} more` : ""}.${extra != null && extra < 2 ? " Add 2 to 4 extra categories for the other things you do." : ""}`
      : "AI tools match you to searches by category. Pick the most specific one.",
  );
  if ((x.profile && x.profile.description !== undefined) || isNew) {
    const len = x.profile?.description?.length || 0;
    add("Business description", 1.5, len >= 500 ? 1 : len >= 250 ? 0.7 : len > 0 ? 0.4 : 0,
      len >= 500 ? "A full description AI tools can quote." : len > 0 ? `Only ${len} characters. Use most of the 750 Google allows: services, area, what makes you different.` : "No description. AI assistants quote it when they recommend you. Write one.");
  }
  add("Opening hours", 1, place.hasHours ? 1 : 0, place.hasHours ? "Hours are listed." : "No hours listed. AI tools skip businesses that might be closed.");
  add("Phone number", 0.5, place.phone ? 1 : 0, place.phone ? "Listed." : "Add a local phone number.");
  add("Website", 1, place.website ? 1 : 0.3, place.website ? "Listed." : "No website. AI tools trust businesses they can confirm on their own site.");
  if (x.site && (x.site.phone != null || x.site.name != null)) {
    const ok = x.site.phone !== false && x.site.name !== false;
    add("Website matches Google", 1, ok ? 1 : x.site.phone === false ? 0.2 : 0.6,
      ok ? "Your site shows the same phone number as Google." : x.site.phone === false ? "Your website doesn't show the phone number Google has. Mismatched details make AI tools unsure." : "Your website doesn't clearly show your business name.");
  }
  const photos = x.profile?.totalPhotos;
  if (photos != null) {
    const bar = Math.max(30, upper(x.rivalPhotos || []));
    add("Photos vs. nearby rivals", 1.5, photos / bar, `You have ${photos}. ${x.rivalPhotos?.length ? `Your strongest rivals have about ${upper(x.rivalPhotos)}.` : ""} Aim for ${bar}+, added a few at a time.`.replace("  ", " "));
  } else {
    add("Photos", 1, place.photoName ? 0.6 : 0, place.photoName ? "You have some photos. Rivals with more photos get picked more." : "Add at least 10 photos of your work or space.");
  }
  {
    const bar = Math.max(15, upper(rivalReviews));
    add("Reviews vs. nearby rivals", 2, reviews / bar, `You have ${reviews}. Your typical rival has ${median(rivalReviews)}, and the strongest have about ${upper(rivalReviews)}.`);
  }
  if (x.fresh || isNew) {
    const d = x.fresh?.newestDays;
    add("Recent reviews", 1.5, d == null ? 0 : d <= 14 ? 1 : d <= 30 ? 0.8 : d <= 90 ? 0.4 : 0.1,
      d == null ? "No reviews yet. Ask your first 10 customers this week." : d <= 30 ? `Newest review ${d} days ago. Keep a few coming every month.` : `Your newest review is ${d} days old. AI tools favor businesses with fresh reviews.`);
  }
  {
    const r = place.rating;
    add("Rating", 1, !r ? 0 : r >= 4.7 ? 1 : r >= 4.5 ? 0.85 : r >= 4.2 ? 0.6 : r >= 4 ? 0.4 : 0.1, r ? `${r} stars.` : "No rating yet. Your first 10 reviews matter most.");
  }

  const counted = rows.filter((r) => r.points != null);
  const total = counted.reduce((n, r) => n + r.weight, 0);
  const got = counted.reduce((n, r) => n + r.weight * (r.points as number), 0);
  const items: Signal[] = counted.map((r) => ({ label: r.label, note: r.note, light: (r.points as number) >= 0.85 ? "green" : (r.points as number) >= 0.5 ? "yellow" : "red" }));
  // Each item still to fix costs extra on top of its lost points (amber 4, red 6, up to 20),
  // so a business with real gaps can't round up into the 90s.
  const yellows = items.filter((i) => i.light === "yellow").length;
  const reds = items.filter((i) => i.light === "red").length;
  const penalty = Math.min(20, yellows * 4 + reds * 6);
  return { items, score: Math.max(0, Math.round((got / (total || 1)) * 100 - penalty)) };
}

/** The graded score with every extra fact we can get. Shared per request. */
export const readiness = cache(async (place: Place, industrySlug: IndustrySlug) => {
  const { term } = checkContext(place, industrySlug);
  const { rivals, demo } = await getRivals(place, industrySlug);
  const [profile, fresh, nearby, site] = await Promise.all([profileFacts(place), reviewFreshness(place.id), nearbyPhotos(place, term), websiteMatches(place)]);
  const rivalPhotos = nearby ? rivals.map((r) => nearby[r.id]?.photos).filter((n): n is number => typeof n === "number") : [];
  // If the profile lookup failed, the Maps search still has photos and claimed status (but no description).
  const mine = nearby?.[place.id];
  const facts: ProfileFacts | null = profile ?? (mine ? { description: undefined, totalPhotos: mine.photos, claimed: mine.claimed, extraCategories: null } : null);
  return { ...signals(place, rivals, { profile: facts, fresh, rivalPhotos, site }), demo };
});

// ---------- 1b) Readiness per assistant ----------
// Each assistant reads different sources (research, Nov 2026): ChatGPT leans on Yelp and industry
// directories, Google's AI on the Google profile, Gemini and Perplexity on the business's own website.
// So one Google-only number misses most of what ChatGPT reads. Three bars, one per kind of assistant.

export type BarKey = "google" | "chatgpt" | "web";
export interface Bar {
  key: BarKey;
  label: string;
  sub: string;
  score: number;
  items: Signal[];
}

// Words that show a review talks about a specific service, by industry (stems).
const SERVICE_WORDS: Record<IndustrySlug, string[]> = {
  "home-services": ["clean", "repair", "install", "replac", "fix", "leak", "drain", "roof", "paint", "lawn", "mow", "pest", "move", "moving", "hvac", "furnace", "ac ", "water heater", "toilet", "outlet", "wiring", "window", "gutter", "carpet", "tree", "deck", "fence", "estimate"],
  beauty: ["cut", "color", "balayage", "highlight", "blowout", "fade", "beard", "nail", "manicure", "pedicure", "gel", "acrylic", "lash", "brow", "wax", "facial", "makeup", "extension", "braid", "perm"],
  "food-trucks": ["taco", "burger", "burrito", "bbq", "sandwich", "pizza", "fries", "wings", "dessert", "coffee", "cater", "event", "wedding", "menu"],
  pet: ["groom", "bath", "nail", "trim", "haircut", "walk", "board", "daycare", "sit", "train", "puppy", "vet", "vaccine"],
  wellness: ["massage", "deep tissue", "facial", "acupunct", "chiropract", "adjust", "yoga", "pilates", "class", "therapy", "stretch", "sauna", "skin", "physical therapy"],
  restaurants: ["pasta", "pizza", "steak", "sushi", "taco", "burger", "brunch", "dessert", "cocktail", "wine", "dish", "menu", "appetizer", "salad", "soup", "special"],
};

function reviewsNameServices(texts: string[] | undefined, industry: IndustrySlug, term: string) {
  if (!texts?.length) return null;
  const words = [...SERVICE_WORDS[industry], ...term.toLowerCase().split(/\s+/).filter((w) => w.length > 3).map((w) => w.slice(0, 5))];
  const hits = texts.filter((t) => words.some((w) => t.toLowerCase().includes(w))).length;
  return { hits, total: texts.length };
}

function score(rows: { label: string; weight: number; points: number | null; note: string }[]): { items: Signal[]; score: number } {
  const counted = rows.filter((r) => r.points != null).map((r) => ({ ...r, points: clamp(r.points as number) }));
  const total = counted.reduce((n, r) => n + r.weight, 0);
  const got = counted.reduce((n, r) => n + r.weight * r.points, 0);
  const items: Signal[] = counted.map((r) => ({ label: r.label, note: r.note, light: r.points >= 0.85 ? "green" : r.points >= 0.5 ? "yellow" : "red" }));
  return { items, score: total ? Math.round((got / total) * 100) : 0 };
}

/** Three readiness bars, one per kind of assistant, plus a blended headline. Needs the listings, so it streams in. */
export const engineReadiness = cache(async (place: Place, industrySlug: IndustrySlug) => {
  const { term } = checkContext(place, industrySlug);
  const [base, report, site, fresh] = await Promise.all([readiness(place, industrySlug), aiReport(place, industrySlug), siteFacts(place), reviewFreshness(place.id)]);
  const lightPoints = (label: string) => {
    const it = base.items.find((i) => i.label === label);
    return it ? (it.light === "green" ? 1 : it.light === "yellow" ? 0.6 : 0.15) : null;
  };
  const yelp = report.listings.find((l) => l.platform === "yelp");
  const dirs = report.directories;
  const named = reviewsNameServices(fresh?.texts, industrySlug, term);
  const s: SiteFacts | null = site;

  const reviewRow = {
    label: "Reviews that name your services",
    weight: 1.5,
    points: named ? named.hits / Math.max(2, Math.ceil(named.total * 0.6)) : null,
    note: named
      ? `${named.hits} of the ${named.total} reviews Google shows mention a specific service. AI picks the business whose reviews prove it does the exact job asked about.`
      : "",
  };

  const chatgpt = score([
    {
      label: "Yelp listing",
      weight: 2.5,
      points: yelp?.state === "found" ? 1 : yelp?.state === "different" ? 0.6 : yelp?.state === "missing" ? 0 : 0.35,
      note:
        yelp?.state === "found" ? "Found. Yelp supplies most of ChatGPT's business cards." : yelp?.state === "missing" ? "No Yelp page found. ChatGPT gets most of its local business details from Yelp." : "We couldn't confirm a Yelp page. ChatGPT gets most of its local business details from Yelp, so check yours.",
    },
    {
      label: "Industry directories",
      weight: 2,
      points: dirs ? Math.min(1, dirs.found.length / 2) : null,
      note: dirs
        ? dirs.found.length
          ? `Found on ${dirs.found.join(" and ")}. ${dirs.missing.length ? `Also get on ${dirs.missing.slice(0, 2).join(" and ")}.` : ""}`.trim()
          : `We didn't see you on ${dirs.missing.slice(0, 3).join(", ")}. ChatGPT cites directories like these in most local answers.`
        : "",
    },
    { label: "Reviews vs. nearby rivals", weight: 2, points: lightPoints("Reviews vs. nearby rivals"), note: "ChatGPT favors the business with more reviews than its neighbors." },
    reviewRow,
    {
      label: "Website open to ChatGPT",
      weight: 1,
      points: s?.blocked ? (s.blocked.chatgpt ? 0 : 1) : null,
      note: s?.blocked?.chatgpt ? "Your robots.txt blocks OAI-SearchBot, so ChatGPT can't read or cite your site." : "ChatGPT's search crawler can read your site.",
    },
  ]);

  const web = score([
    { label: "Website", weight: 2, points: place.website ? 1 : 0, note: place.website ? "Listed on Google." : "No website. Gemini and Perplexity cite business websites in about 9 of 10 local answers." },
    {
      label: "A page for each service",
      weight: 2,
      points: s ? Math.min(1, s.servicePages / 3) : null,
      note: s
        ? s.servicePages >= 3
          ? `About ${s.servicePages} service pages found.`
          : `${s.servicePages ? `Only ${s.servicePages} service ${s.servicePages === 1 ? "page" : "pages"} found.` : "No service pages found."} AI assistants pick the business that proves it offers the exact service asked about, and a smaller business with a service page beats a bigger one without.`
        : "",
    },
    { label: "Prices on your site", weight: 1, points: s ? (s.prices ? 1 : 0.2) : null, note: s?.prices ? "Your site shows prices." : "No prices found. Even \"from $X\" helps AI answer \"how much\" questions with your name." },
    { label: "Licenses and credentials shown", weight: 1, points: s ? (s.credentials ? 1 : 0.2) : null, note: s?.credentials ? "Your site mentions licenses, insurance or certifications." : "No license, insurance or certification found. AI repeats specific proof like this." },
    { label: "Page for your city or areas", weight: 1, points: s ? (s.areaPage ? 1 : 0.3) : null, note: s?.areaPage ? "Found a page for the areas you serve." : "No page for your city or service areas. Service-plus-city pages are often what AI cites." },
    { label: "Business details in code (schema)", weight: 0.75, points: s ? (s.schema ? 1 : 0.2) : null, note: s?.schema ? "Your site has LocalBusiness schema." : "No LocalBusiness schema. It tells AI your name, hours and area without guessing." },
    {
      label: "Website open to AI search",
      weight: 1,
      points: s?.blocked ? (s.blocked.perplexity || s.blocked.gemini ? 0 : 1) : null,
      note: s?.blocked && (s.blocked.perplexity || s.blocked.gemini) ? `Your robots.txt blocks ${[s.blocked.perplexity && "PerplexityBot", s.blocked.gemini && "Google-Extended"].filter(Boolean).join(" and ")}.` : "AI search crawlers can read your site.",
    },
    { label: "Website matches Google", weight: 1, points: lightPoints("Website matches Google"), note: "Same name and phone on your site and on Google." },
  ]);

  const bars: Bar[] = [
    { key: "chatgpt", label: "ChatGPT", sub: "Reads Yelp, industry directories and reviews", ...chatgpt },
    { key: "google", label: "Google AI", sub: "Reads your Google profile", score: base.score, items: [] },
    { key: "web", label: "Gemini and Perplexity", sub: "Read your own website", ...web },
  ];
  const overall = Math.round(bars[0].score * 0.35 + bars[1].score * 0.4 + bars[2].score * 0.25);
  return { bars, overall, demo: base.demo || report.demo };
});

// ---------- 2) Real AI answers, cached by question ----------

async function runAnswers(placeName: string, rivalNames: string[], prompts: string[], area: string, fresh = false): Promise<{ answers: EngineAnswer[]; demo: boolean }> {
  const { engines, demo } = checkEngines();
  if (demo) return { answers: mockAnswers(placeName, rivalNames, prompts, engines, fresh), demo: true };
  const ask = fresh ? askEngineFull : cachedAskFree;
  // Every kind of question gets asked: with one engine it asks all three, with more they take turns.
  const jobs = Array.from({ length: Math.max(FREE_QUESTIONS, engines.length) }, (_, i) => ({ engine: engines[i % engines.length], prompt: prompts[i % prompts.length] }));
  const answers = await Promise.all(
    jobs.map(async ({ engine, prompt }): Promise<EngineAnswer | null> => {
      try {
        const { text, sources } = await ask(engine, prompt, area);
        const mentionsYou = mentions(text, placeName);
        const named = rivalNames.filter((r) => mentions(text, r));
        const { placement, rank } = placementIn(text, placeName, mentionsYou);
        return { engine, prompt, mentionsYou, placement, rank, rivalsMentioned: named, picks: picksIn(text, [placeName]), excerpt: excerptAround(text, mentionsYou ? placeName : named[0] || ""), sources };
      } catch (e) {
        console.error("engine failed", engine, e);
        return null;
      }
    }),
  );
  return { answers: answers.filter(Boolean) as EngineAnswer[], demo: false };
}

function mockAnswers(placeName: string, rivalNames: string[], prompts: string[], engines: Engine[], fresh = false): EngineAnswer[] {
  const r = seeded(placeName + (fresh ? Date.now() : ""));
  return engines.map((engine, i) => {
    const prompt = prompts[i % prompts.length];
    const picks = rivalNames.filter(() => r() > 0.45).slice(0, 3);
    const rivalsMentioned = picks.length ? picks : rivalNames.slice(0, 2);
    const mentionsYou = fresh ? r() > 0.5 : engine === "perplexity";
    return {
      engine,
      prompt,
      mentionsYou,
      rivalsMentioned,
      picks: rivalsMentioned,
      excerpt: `Here are a few well-reviewed options: ${rivalsMentioned.join(", ")}${mentionsYou ? `, and ${placeName}, which opened recently` : ""}.`,
      sources: ["yelp.com", "google.com", "facebook.com"].slice(0, 2 + (i % 2)),
    };
  });
}

// ---------- 3) Listings everywhere else (per business, cached a week) ----------

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
        { platform: "apple", state: "unknown", note: "" },
        { platform: "bing", state: "unknown", note: "" },
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

async function rivalProfiles(rivals: Place[], area: string): Promise<Record<string, Partial<Record<Platform, boolean | null>>>> {
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
      // Keep "couldn't tell" as null so the page never shows a guess as a "No".
      const v = (x: boolean | null | undefined) => (typeof x === "boolean" ? x : null);
      return [r.name, { google: true, yelp: v(row.yelp), apple: v(row.apple), bing: v(row.bing), facebook: v(row.facebook) }];
    }),
  );
}

// ---------- 3b) Listings through DataForSEO (when connected) ----------
// One Google search per business reads Google's own business panel, which lists the Facebook page,
// and the results, which sometimes show the Yelp page. Yelp hides most pages from search engines
// (Claude's web search finds them no better), so a Yelp page we can't see reads "can't tell", not "no".
// Apple Maps and Bing Places can't be seen from web search at all, so the owner gets a 30-second
// "check it yourself" instead of a guess. Cost: about $0.002 per business, no AI calls.

const CHECK_YOURSELF: ListingCheck[] = [
  { platform: "apple", state: "claim", note: "Siri and Apple Maps use this. Apple listings don't show up in web searches, so claim yours to be sure.", url: "https://businessconnect.apple.com" },
  { platform: "bing", state: "claim", note: "ChatGPT's search leans on Bing. Bing Places copies your Google profile in one click.", url: "https://www.bing.com/forbusiness" },
];

/** Apple Maps, Bing Places and ChatGPT can't be seen from outside: show them as a step to claim, not as "can't tell". */
function asClaim(l: ListingCheck): ListingCheck {
  if (l.state !== "unknown") return l;
  if (l.platform === "apple" || l.platform === "bing") return CHECK_YOURSELF.find((c) => c.platform === l.platform)!;
  if (l.platform === "chatgpt") return { platform: "chatgpt", state: "claim", note: "New in 2026: claim your ChatGPT business profile to control what ChatGPT shows about you.", url: "https://chatgpt.com/business-hub" };
  return l;
}

async function directoryListings(place: Place, isNew: boolean, rivals: Place[], area: string, industry: IndustrySlug) {
  const all = [place, ...rivals];
  const dirs = directoriesFor(industry);
  const domains = dirs.map((d) => d.domain);
  const hits: DirectoryHit[] = await Promise.all(all.map((b) => directoriesSafe(b.name, b.address || area, b === place && isNew ? undefined : b.id, domains)));
  const [mine, ...theirs] = hits;

  const listings: ListingCheck[] = [
    isNew ? { platform: "google", state: "missing", note: "Not on Google yet. This is step one." } : { platform: "google", state: "found", note: "Found on Google Maps.", url: place.mapsUrl },
    mine.yelp
      ? { platform: "yelp", state: "found", note: "Found your Yelp page." }
      : { platform: "yelp", state: "unknown", note: "We couldn't confirm a Yelp page. Search Yelp for your name to check. AI tools quote Yelp more than any other directory." },
    ...CHECK_YOURSELF,
    mine.facebook
      ? { platform: "facebook", state: "found", note: "Found your Facebook page on your Google profile." }
      : mine.facebook === false
        ? { platform: "facebook", state: "missing", note: "Your Google profile doesn't show a Facebook page. If you have one, add its link to your profile." }
        : { platform: "facebook", state: "unknown", note: "We couldn't confirm a Facebook page. Worth a quick look." },
    { platform: "chatgpt", state: "unknown", note: "ChatGPT's new business profiles can't be checked from outside yet. Claim yours to be safe." },
  ];
  // Apple and Bing stay null ("couldn't check") for rivals too.
  const profiles = Object.fromEntries(rivals.map((r, i) => [r.name, { google: true, yelp: theirs[i].yelp, apple: null, bing: null, facebook: theirs[i].facebook }]));
  const directories = mine.others ? { found: dirs.filter((d) => mine.others!.includes(d.domain)).map((d) => d.name), missing: dirs.filter((d) => !mine.others!.includes(d.domain)).map((d) => d.name) } : null;
  return { listings, demo: false, profiles, directories };
}

// ---------- 3c) Listings through Serper.dev (when DataForSEO has no balance) ----------
// Google site: searches for the business's own Yelp, Facebook and Apple Maps pages and its industry
// directories (4 searches), plus one Yelp/Facebook search per rival. Under a cent per check, cached a week.

async function serperListings(place: Place, isNew: boolean, rivals: Place[], area: string, industry: IndustrySlug) {
  const dirs = directoriesFor(industry);
  const [mine, ...theirs] = await Promise.all([
    ownerListings(place.name, place.address || area, dirs.map((d) => d.domain), place.phone),
    ...rivals.map((r) => rivalListings(r.name, r.address || area, r.phone)),
  ]);
  const listings: ListingCheck[] = [
    isNew ? { platform: "google", state: "missing", note: "Not on Google yet. This is step one." } : { platform: "google", state: "found", note: "Found on Google Maps.", url: place.mapsUrl },
    mine.yelp
      ? { platform: "yelp", state: "found", note: "Found your Yelp page." }
      : { platform: "yelp", state: "unknown", note: "We couldn't confirm a Yelp page. Search Yelp for your name to check. AI tools quote Yelp more than any other directory." },
    mine.apple ? { platform: "apple", state: "found", note: "Found on Apple Maps." } : CHECK_YOURSELF[0],
    CHECK_YOURSELF[1],
    mine.facebook
      ? { platform: "facebook", state: "found", note: "Found your Facebook page." }
      : { platform: "facebook", state: "unknown", note: "We couldn't confirm a Facebook page. Worth a quick look." },
    { platform: "chatgpt", state: "unknown", note: "ChatGPT's new business profiles can't be checked from outside yet. Claim yours to be safe." },
  ];
  const profiles = Object.fromEntries(rivals.map((r, i) => [r.name, { google: true, yelp: theirs[i].yelp, apple: null, bing: null, facebook: theirs[i].facebook }]));
  const directories = mine.others ? { found: dirs.filter((d) => mine.others!.includes(d.domain)).map((d) => d.name), missing: dirs.filter((d) => !mine.others!.includes(d.domain)).map((d) => d.name) } : null;
  return { listings, demo: false, profiles, directories };
}

const cachedSerperListings = (place: Place, isNew: boolean, rivals: Place[], area: string, industry: IndustrySlug) =>
  unstable_cache(() => serperListings(place, isNew, rivals, area, industry), ["listings-serper-v2", place.id, place.name, industry, rivals.map((r) => r.id).join(",")], {
    revalidate: 60 * 60 * 24 * 7,
  })();

const cachedListings = unstable_cache(
  async (placeKey: string, place: Place, isNew: boolean, rivals: Place[], area: string) => {
    void placeKey;
    const [scan, profiles] = await Promise.all([scanListings(place, isNew, area), rivalProfiles(rivals, area)]);
    return { listings: scan.listings, demo: scan.demo, profiles };
  },
  ["listings-v2"],
  { revalidate: 60 * 60 * 24 * 7 },
);

// Keyed by ids only, so small changes in Google's data (a new review) don't trigger new paid searches.
const cachedDirectoryListings = (place: Place, isNew: boolean, rivals: Place[], area: string, industry: IndustrySlug) =>
  unstable_cache(() => directoryListings(place, isNew, rivals, area, industry), ["listings-dfs-v3", place.id, place.name, industry, rivals.map((r) => r.id).join(",")], {
    revalidate: 60 * 60 * 24 * 7, // listings change slowly: a week
  })();

/** Full AI section. Wrapped in cache() so the score card and the details share one run per request. */
export const aiReport = cache(async (place: Place, industrySlug: IndustrySlug) => {
  const { industry, term, area, isNew } = checkContext(place, industrySlug);
  const { rivals: rivalPlaces, demo: rivalsDemo } = await getRivals(place, industrySlug);
  const prompts = buildPrompts(industry, term, area);
  const dfs = !place.id.startsWith("demo_") && (await dataforseoReady());
  const [ans, lst] = await Promise.all([
    runAnswers(place.name, rivalPlaces.map((r) => r.name), prompts, area),
    dfs
      ? cachedDirectoryListings(place, isNew, rivalPlaces, area, industrySlug)
      : hasSerper() && !place.id.startsWith("demo_")
        ? cachedSerperListings(place, isNew, rivalPlaces, area, industrySlug)
        : cachedListings(`${place.id}|${place.name}`, place, isNew, rivalPlaces, area).then((x) => ({ ...x, directories: null })),
  ]);
  const rivals: Rival[] = rivalPlaces.map((r) => ({
    ...r,
    aiMentions: ans.answers.filter((a) => a.rivalsMentioned.includes(r.name)).length,
    profiles: lst.profiles[r.name],
  }));
  return {
    answers: ans.answers,
    listings: lst.listings.map(asClaim),
    directories: lst.directories as { found: string[]; missing: string[] } | null,
    rivals,
    demo: ans.demo || lst.demo || rivalsDemo || place.id.startsWith("demo_"),
  };
});

/** A paid re-check: asks every question again, skipping the cache. Costs one credit. */
export async function freshCheck(place: Place, industrySlug: IndustrySlug) {
  const { industry, term, area } = checkContext(place, industrySlug);
  const { rivals } = await getRivals(place, industrySlug);
  const res = await runAnswers(place.name, rivals.map((r) => r.name), buildPrompts(industry, term, area), area, true);
  if (!res.answers.length) throw new Error("No AI answers came back.");
  return { ...res, ...visibility(res.answers), checkedAt: new Date().toISOString() };
}

/**
 * Where the business landed in one answer. The recommended businesses are read in order from the
 * answer's formatting; named outside that list (a caveat, "I couldn't confirm...") is "mentioned".
 * When the answer has no list to read, a mention counts as recommended lower down.
 */
export function placementIn(text: string, placeName: string, mentionsYou = mentions(text, placeName)): { placement: Placement; rank?: number } {
  if (!mentionsYou) return { placement: "none" };
  const all = picksIn(text, [], 20); // the full list: you may be the 7th pick
  const i = all.findIndex((p) => sameBrand(p, placeName));
  if (i === 0) return { placement: "first", rank: 1 };
  if (i > 0) return { placement: "listed", rank: i + 1 };
  return { placement: all.length ? "mentioned" : "listed" };
}

/** Points per answer: top pick 100, then 80 for #2 down to 40, a passing mention 25, not named 0. */
export function placementPoints(a: EngineAnswer): number {
  const p = a.placement || (a.mentionsYou ? "listed" : "none");
  if (p === "first") return 100;
  if (p === "listed") return a.rank ? Math.max(40, 100 - 10 * a.rank) : 60;
  if (p === "mentioned") return 25;
  return 0;
}

export function placementLabel(a: EngineAnswer): string {
  const p = a.placement || (a.mentionsYou ? "listed" : "none");
  if (p === "first") return "Top pick";
  if (p === "listed") return a.rank ? `Named #${a.rank}` : "Named you";
  if (p === "mentioned") return "Mentioned, not recommended";
  return "Didn't name you";
}

/** The free check's headline: 0 to 100 from where you land in each answer, not just whether you're in it. */
export function visibilityScore(answers: EngineAnswer[]) {
  const score = answers.length ? Math.round(answers.reduce((n, a) => n + placementPoints(a), 0) / answers.length) : 0;
  return { score, ...visibility(answers) };
}

/** One number across every engine and question: the share of answers that name you. */
export function visibility(answers: EngineAnswer[]) {
  const pct = answers.length ? Math.round((answers.filter((a) => a.mentionsYou).length / answers.length) * 100) : 0;
  const byEngine = [...new Set(answers.map((a) => a.engine))].map((engine) => {
    const mine = answers.filter((a) => a.engine === engine);
    return { engine, label: ENGINE_LABEL[engine], named: mine.filter((a) => a.mentionsYou).length, total: mine.length };
  });
  return { pct, byEngine };
}

// ---------- 4) Citation gaps: directories rivals are on and you aren't ----------

export interface CitationGap {
  platform: Platform;
  rivalsListed: number;
  rivalsTotal: number;
  rivalNames: string[];
  state: ListingCheck["state"];
}

const DIRECTORIES: Platform[] = ["yelp", "facebook"]; // Apple Maps and Bing Places can't be checked for rivals either

export function citationGaps(listings: ListingCheck[], rivals: Rival[]): CitationGap[] {
  return DIRECTORIES.map((platform) => {
    const mine = listings.find((l) => l.platform === platform);
    const on = rivals.filter((r) => r.profiles?.[platform]);
    return { platform, rivalsListed: on.length, rivalsTotal: rivals.length, rivalNames: on.slice(0, 3).map((r) => r.name), state: mine?.state || "unknown" };
  })
    .filter((g) => g.state !== "found" && g.rivalsListed > 0)
    .sort((a, b) => b.rivalsListed - a.rivalsListed);
}

export function aiSummary(answers: EngineAnswer[], rivals: Rival[]) {
  const total = answers.length || 1;
  const named = answers.filter((a) => a.mentionsYou).length;
  const topRivals = [...rivals].sort((a, b) => b.aiMentions - a.aiMentions).filter((r) => r.aiMentions > 0).slice(0, 3);
  const light: Light = named / total >= 0.5 ? "green" : named > 0 ? "yellow" : "red";
  let headline: string;
  const picked = aiPicks(answers);
  if (named === 0 && topRivals.length) headline = `AI recommends ${topRivals.length === 1 ? topRivals[0].name : `these ${topRivals.length} rivals`}, not you.`;
  else if (named === 0 && picked.length) headline = `AI recommends ${picked[0].name}${picked.length > 1 ? " and others" : ""}, not you.`;
  else if (named === 0) headline = "AI assistants don't recommend you yet.";
  else headline = `AI named you in ${named} of ${total} answers. Let's make it every time.`;
  return { named, total, topRivals, picked, light, headline };
}

/** Every business the AI recommended across the answers, most often first: the real competition in AI. */
export function aiPicks(answers: EngineAnswer[]): { name: string; count: number }[] {
  const out: { name: string; count: number }[] = [];
  for (const a of answers) {
    const seen = new Set<string>();
    for (const name of a.picks?.length ? a.picks : a.rivalsMentioned) {
      const row = out.find((o) => sameBrand(o.name, name));
      if (row && seen.has(row.name)) continue;
      if (row) row.count++;
      else out.push({ name, count: 1 });
      seen.add(row ? row.name : name);
    }
  }
  return out.sort((x, y) => y.count - x.count);
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

export interface Fix {
  title: string;
  why: string;
}

/**
 * Everything the check found that the Launch Kit fixes, most important first.
 * Built only from this report's own results (listings, AI answers, Google signals).
 */
const FIX_TITLE: Record<string, string> = {
  "Profile claimed by you": "Claim and verify your Google profile",
  Categories: "Add the right extra categories",
  "Business description": "Write a full Google description",
  "Opening hours": "Add your opening hours",
  "Phone number": "Add your phone number",
  Website: "Add a website, even a one-page one",
  "Website matches Google": "Make your website match Google",
  "Photos vs. nearby rivals": "Add photos to catch up with rivals",
  Photos: "Add photos of your work and space",
  "Reviews vs. nearby rivals": "Get more reviews than your rivals",
  "Recent reviews": "Get fresh reviews this month",
  Rating: "Lift your rating with reviews from happy customers",
  "Industry directories": "Get listed on your industry's directories",
  "Reviews that name your services": "Get reviews that mention the exact service",
  "Website open to ChatGPT": "Let ChatGPT read your website",
  "A page for each service": "Add a page for each service on your site",
  "Prices on your site": "Show prices on your website",
  "Licenses and credentials shown": "Show your licenses and credentials",
  "Page for your city or areas": "Add a page for the areas you serve",
  "Business details in code (schema)": "Add business schema to your website",
  "Website open to AI search": "Let AI search crawlers read your site",
};

export function findFixes(place: Place, report: { answers: EngineAnswer[]; listings: ListingCheck[]; rivals: Rival[] }, sig: Signal[]): Fix[] {
  const fixes: Fix[] = [];
  const google = report.listings.find((l) => l.platform === "google");
  if (place.id === "new" || google?.state === "missing") {
    fixes.push({ title: "Create and verify your Google profile", why: "Not on Google Maps yet. AI assistants and Maps can't recommend you until you are." });
  }
  const skipped = report.answers.filter((a) => !a.mentionsYou);
  if (skipped.length) {
    const top = [...report.rivals].sort((a, b) => b.aiMentions - a.aiMentions)[0];
    const pick = aiPicks(report.answers)[0];
    fixes.push({
      title: `Get named by AI assistants (skipped in ${skipped.length} of ${report.answers.length} answers)`,
      why: top?.aiMentions ? `${top.name} was named instead. Your profile needs the categories, services and wording AI looks for.` : pick ? `AI picked ${pick.name} instead. Your profile needs the categories, services and wording AI looks for.` : "Your profile needs the categories, services and wording AI looks for.",
    });
  }
  const gaps = citationGaps(report.listings, report.rivals);
  // Missing listings that the most rivals have come first.
  const rank = (l: ListingCheck) => gaps.find((g) => g.platform === l.platform)?.rivalsListed || 0;
  for (const l of [...report.listings].sort((x, y) => rank(y) - rank(x))) {
    if (l.platform === "google" || l.platform === "chatgpt") continue;
    const gap = gaps.find((g) => g.platform === l.platform);
    if (l.state === "missing") {
      fixes.push({ title: `Get listed on ${PLATFORM_LABEL[l.platform]}`, why: gap ? `${gap.rivalsListed} of ${gap.rivalsTotal} nearby rivals are there. You're not.` : l.note });
    } else if (l.state === "different") {
      fixes.push({ title: `Fix the wrong details on ${PLATFORM_LABEL[l.platform]}`, why: l.note });
    }
  }
  // Red signals first, then amber ones, each as a concrete step.
  for (const light of ["red", "yellow"] as const) {
    for (const s of sig) {
      const title = FIX_TITLE[s.label];
      if (s.light === light && title) fixes.push({ title, why: s.note });
    }
  }
  const toClaim = report.listings.filter((l) => (l.platform === "apple" || l.platform === "bing") && l.state === "claim");
  if (toClaim.length) {
    fixes.push({
      title: `Claim your ${toClaim.map((l) => PLATFORM_LABEL[l.platform]).join(" and ")} listing${toClaim.length > 1 ? "s" : ""}`,
      why: "Siri and Apple Maps use Apple's listings, and ChatGPT's search leans on Bing. Neither shows up in web searches, so claim them to be sure.",
    });
  }
  if (report.listings.some((l) => l.platform === "chatgpt" && l.state !== "found")) {
    fixes.push({ title: "Claim your ChatGPT business profile", why: "New in 2026. It controls what ChatGPT shows about you." });
  }
  return fixes;
}
