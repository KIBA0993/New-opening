import "server-only";
import { unstable_cache } from "next/cache";
import { has } from "./env";
import { buildPrompts, industryBySlug, searchTerm } from "./industries";
import { seeded } from "./mock";
import { askEngine, engineAvailable, excerptAround, mentions, searchJSON } from "./providers/ai";
import { findRivals } from "./providers/places";
import type { Engine, EngineAnswer, IndustrySlug, ListingCheck, Place, Platform, Report, Rival } from "./types";

const ENGINES: Engine[] = ["chatgpt", "perplexity", "gemini"];

export const PLATFORM_LABEL: Record<Platform, string> = {
  google: "Google Maps",
  apple: "Apple Maps",
  bing: "Bing Places",
  yelp: "Yelp",
  facebook: "Facebook",
  chatgpt: "ChatGPT",
};

// ---------- AI answers ----------

async function runAnswers(placeName: string, rivalNames: string[], prompts: string[]): Promise<{ answers: EngineAnswer[]; demo: boolean }> {
  const live = ENGINES.filter(engineAvailable);
  if (live.length === 0) return { answers: mockAnswers(placeName, rivalNames, prompts), demo: true };
  const jobs = live.flatMap((engine) => prompts.map((prompt) => ({ engine, prompt })));
  const answers = await Promise.all(
    jobs.map(async ({ engine, prompt }): Promise<EngineAnswer | null> => {
      try {
        const text = await askEngine(engine, prompt);
        const mentionsYou = mentions(text, placeName);
        return {
          engine,
          prompt,
          mentionsYou,
          rivalsMentioned: rivalNames.filter((r) => mentions(text, r)),
          excerpt: excerptAround(text, mentionsYou ? placeName : rivalNames.find((r) => mentions(text, r)) || ""),
        };
      } catch (e) {
        console.error("engine failed", engine, e);
        return null;
      }
    }),
  );
  // Engines without a key still show up, as demo rows, so the card always has three engines.
  const missing = ENGINES.filter((e) => !live.includes(e));
  const filler = mockAnswers(placeName, rivalNames, prompts).filter((a) => missing.includes(a.engine));
  return { answers: [...(answers.filter(Boolean) as EngineAnswer[]), ...filler], demo: missing.length > 0 };
}

function mockAnswers(placeName: string, rivalNames: string[], prompts: string[]): EngineAnswer[] {
  const r = seeded(placeName);
  return ENGINES.flatMap((engine) =>
    prompts.map((prompt, i) => {
      const picks = rivalNames.filter(() => r() > 0.45).slice(0, 3);
      const rivalsMentioned = picks.length ? picks : rivalNames.slice(i % rivalNames.length, (i % rivalNames.length) + 2);
      const mentionsYou = engine === "perplexity" && i === 2; // a new business is rarely named
      return {
        engine,
        prompt,
        mentionsYou,
        rivalsMentioned,
        excerpt: `Here are a few well-reviewed options: ${rivalsMentioned.join(", ")}${mentionsYou ? `, and ${placeName}, which opened recently` : ""}. Each has strong ratings and is easy to book.`,
      };
    }),
  );
}

// ---------- Listings everywhere else ----------

interface ScanResult {
  [k: string]: { found: boolean | null; url?: string; phone?: string; address?: string; note?: string } | undefined;
}

const digits = (s?: string) => (s || "").replace(/\D/g, "").slice(-10);

async function scanListings(place: Place, isNew: boolean): Promise<{ listings: ListingCheck[]; demo: boolean }> {
  const google: ListingCheck = isNew
    ? { platform: "google", state: "missing", note: "Not on Google yet. This is step one." }
    : { platform: "google", state: "found", note: "Found on Google Maps.", url: place.mapsUrl };
  const chatgpt: ListingCheck = {
    platform: "chatgpt",
    state: "unknown",
    note: "ChatGPT's new business profiles can't be checked from outside yet. Claim yours to be safe.",
  };

  if (!has.perplexity() && !has.openai()) {
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
  const scan = (await searchJSON<ScanResult>(prompt)) || {};
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
  if (!has.perplexity() && !has.openai()) {
    const r = seeded(rivals.map((x) => x.name).join());
    return Object.fromEntries(
      rivals.map((x) => [x.name, { google: true, yelp: r() > 0.2, apple: r() > 0.4, bing: r() > 0.5, facebook: r() > 0.3 }]),
    );
  }
  const prompt = `For each of these local businesses in ${area}, say whether they have a Yelp page, an Apple Maps listing, a Bing Places listing and a Facebook page.
${rivals.map((r) => `- ${r.name} (${r.address})`).join("\n")}
Return JSON: {"<exact business name>": {"yelp": true|false|null, "apple": true|false|null, "bing": true|false|null, "facebook": true|false|null}}`;
  const out = (await searchJSON<Record<string, Partial<Record<Platform, boolean | null>>>>(prompt)) || {};
  return Object.fromEntries(
    rivals.map((r) => {
      const row = out[r.name] || {};
      return [r.name, { google: true, yelp: !!row.yelp, apple: !!row.apple, bing: !!row.bing, facebook: !!row.facebook }];
    }),
  );
}

// AI answers and listing scans cost money, so cache them for a day per business.
const cachedAI = unstable_cache(
  async (placeKey: string, place: Place, isNew: boolean, rivals: Place[], prompts: string[], area: string) => {
    void placeKey;
    const [ans, scan, profiles] = await Promise.all([
      runAnswers(place.name, rivals.map((r) => r.name), prompts),
      scanListings(place, isNew),
      rivalProfiles(rivals, area),
    ]);
    return { ...ans, listings: scan.listings, scanDemo: scan.demo, profiles };
  },
  ["report-ai-v1"],
  { revalidate: 60 * 60 * 24 },
);

export async function buildReport(place: Place, industrySlug: IndustrySlug): Promise<Report> {
  const industry = industryBySlug(industrySlug)!;
  const isNew = place.id === "new";
  const term = searchTerm(industry, place.primaryTypeLabel);
  const area = place.city || place.address;
  const prompts = buildPrompts(industry, term, area);
  const { rivals: rivalPlaces, demo: rivalsDemo } = await findRivals(place, industrySlug, `${term} near ${area}`);
  const ai = await cachedAI(`${place.id}|${place.name}|${industrySlug}`, place, isNew, rivalPlaces, prompts, area);
  const rivals: Rival[] = rivalPlaces.map((r) => ({
    ...r,
    aiMentions: ai.answers.filter((a) => a.rivalsMentioned.includes(r.name)).length,
    profiles: ai.profiles[r.name],
  }));
  return {
    place,
    industry: industrySlug,
    area,
    rivals,
    answers: ai.answers,
    listings: ai.listings,
    generatedAt: new Date().toISOString(),
    demo: rivalsDemo || ai.demo || ai.scanDemo || place.id.startsWith("demo_"),
  };
}

// ---------- Scoring, in plain words ----------

export type Light = "green" | "yellow" | "red";

export function summarize(report: Report) {
  const total = report.answers.length || 1;
  const named = report.answers.filter((a) => a.mentionsYou).length;
  const listed = report.listings.filter((l) => l.state === "found").length;
  const fixable = report.listings.filter((l) => l.state === "missing" || l.state === "different").length;
  const rivalReviews = report.rivals.map((r) => r.reviewCount || 0).sort((a, b) => a - b);
  const medianRival = rivalReviews.length ? rivalReviews[Math.floor(rivalReviews.length / 2)] : 0;
  const yours = report.place.reviewCount || 0;
  const topRivals = [...report.rivals].sort((a, b) => b.aiMentions - a.aiMentions).filter((r) => r.aiMentions > 0).slice(0, 3);

  const ai: Light = named / total >= 0.5 ? "green" : named > 0 ? "yellow" : "red";
  const listings: Light = fixable === 0 ? "green" : listed >= 3 ? "yellow" : "red";
  const reviews: Light = yours >= medianRival ? "green" : yours >= medianRival / 3 ? "yellow" : "red";
  const overall: Light = [ai, listings, reviews].includes("red") ? "red" : [ai, listings, reviews].includes("yellow") ? "yellow" : "green";

  let headline: string;
  if (named === 0 && topRivals.length) {
    headline = `AI recommends ${topRivals.length === 1 ? topRivals[0].name : `these ${topRivals.length} rivals`}, not you.`;
  } else if (named === 0) {
    headline = "AI tools don't recommend you yet.";
  } else {
    headline = `AI named you in ${named} of ${total} answers. Let's make it every time.`;
  }

  let nextFix: string;
  if (report.listings[0]?.state === "missing") nextFix = "Create your Google profile";
  else if (report.listings.some((l) => l.state === "different")) nextFix = "Fix the wrong details on " + PLATFORM_LABEL[report.listings.find((l) => l.state === "different")!.platform];
  else if (report.listings.some((l) => l.state === "missing")) nextFix = "Get listed on " + PLATFORM_LABEL[report.listings.find((l) => l.state === "missing")!.platform];
  else if (reviews !== "green") nextFix = "Get your next 10 reviews";
  else nextFix = "Claim your ChatGPT business profile";

  return { named, total, listed, fixable, yours, medianRival, topRivals, lights: { ai, listings, reviews, overall }, headline, nextFix };
}
