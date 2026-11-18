import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { has } from "./env";
import { buildPrompts, industryBySlug, searchTerm } from "./industries";
import { seeded } from "./mock";
import { askEngine, cachedAskFree, checkEngines, ENGINE_LABEL, excerptAround, mentions, sameBrand, searchJSON } from "./providers/ai";
import { directoriesSafe, type DirectoryHit } from "./providers/listings";
import { nearbyPhotos, profileFacts, websiteMatches, type ProfileFacts } from "./providers/profile";
import { reviewFreshness, type ReviewFreshness } from "./providers/places";
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
  const found = await findRivals(place, industrySlug, `${term} near ${area}`);
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

// ---------- 2) Real AI answers, cached by question ----------

async function runAnswers(placeName: string, rivalNames: string[], prompts: string[], area: string, fresh = false): Promise<{ answers: EngineAnswer[]; demo: boolean }> {
  const { engines, demo } = checkEngines();
  if (demo) return { answers: mockAnswers(placeName, rivalNames, prompts, engines, fresh), demo: true };
  const perEngine = Math.max(1, Math.ceil(FREE_QUESTIONS / engines.length));
  const ask = fresh ? askEngine : cachedAskFree;
  const jobs = engines.flatMap((engine) => prompts.slice(0, perEngine).map((prompt) => ({ engine, prompt })));
  const answers = await Promise.all(
    jobs.map(async ({ engine, prompt }): Promise<EngineAnswer | null> => {
      try {
        const text = await ask(engine, prompt, area);
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
      excerpt: `Here are a few well-reviewed options: ${rivalsMentioned.join(", ")}${mentionsYou ? `, and ${placeName}, which opened recently` : ""}.`,
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
  { platform: "apple", state: "unknown", note: "Apple Maps listings don't show up in web searches. Search your name in Apple Maps on an iPhone to check." },
  { platform: "bing", state: "unknown", note: "Search your name at bing.com/maps to check. Bing feeds ChatGPT's search, so it's worth a look." },
];

async function directoryListings(place: Place, isNew: boolean, rivals: Place[], area: string) {
  const all = [place, ...rivals];
  const hits: DirectoryHit[] = await Promise.all(all.map((b) => directoriesSafe(b.name, b.address || area, b === place && isNew ? undefined : b.id)));
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
  return { listings, demo: false, profiles };
}

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
const cachedDirectoryListings = (place: Place, isNew: boolean, rivals: Place[], area: string) =>
  unstable_cache(() => directoryListings(place, isNew, rivals, area), ["listings-dfs-v1", place.id, place.name, rivals.map((r) => r.id).join(",")], {
    revalidate: 60 * 60 * 24 * 7, // listings change slowly: a week
  })();

/** Full AI section. Wrapped in cache() so the score card and the details share one run per request. */
export const aiReport = cache(async (place: Place, industrySlug: IndustrySlug) => {
  const { industry, term, area, isNew } = checkContext(place, industrySlug);
  const { rivals: rivalPlaces, demo: rivalsDemo } = await getRivals(place, industrySlug);
  const prompts = buildPrompts(industry, term, area);
  const [ans, lst] = await Promise.all([
    runAnswers(place.name, rivalPlaces.map((r) => r.name), prompts, area),
    has.dataforseo() && !place.id.startsWith("demo_")
      ? cachedDirectoryListings(place, isNew, rivalPlaces, area)
      : cachedListings(`${place.id}|${place.name}`, place, isNew, rivalPlaces, area),
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
});

/** A paid re-check: asks every question again, skipping the cache. Costs one credit. */
export async function freshCheck(place: Place, industrySlug: IndustrySlug) {
  const { industry, term, area } = checkContext(place, industrySlug);
  const { rivals } = await getRivals(place, industrySlug);
  const res = await runAnswers(place.name, rivals.map((r) => r.name), buildPrompts(industry, term, area), area, true);
  if (!res.answers.length) throw new Error("No AI answers came back.");
  return { ...res, ...visibility(res.answers), checkedAt: new Date().toISOString() };
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

const DIRECTORIES: Platform[] = ["yelp", "apple", "bing", "facebook"];

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
    fixes.push({
      title: `Get named by AI assistants (skipped in ${skipped.length} of ${report.answers.length} answers)`,
      why: top?.aiMentions ? `${top.name} was named instead. Your profile needs the categories, services and wording AI looks for.` : "Your profile needs the categories, services and wording AI looks for.",
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
  if (report.listings.some((l) => l.platform === "chatgpt" && l.state !== "found")) {
    fixes.push({ title: "Claim your ChatGPT business profile", why: "New in 2026. It controls what ChatGPT shows about you." });
  }
  return fixes;
}
