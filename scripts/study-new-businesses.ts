// Research study: do AI assistants know about businesses that just opened?
//
// Sample: City of Chicago business licenses issued 30 to 120 days ago (public open data),
// in the industries MapDebut serves. For each business we check:
//   1. Google Maps: is there a listing, and how many reviews (Google Places API, New).
//   2. AI by category: "best <category> in <neighborhood>, Chicago" (Claude with live web search).
//      Answers are cached per (category, neighborhood), the same way the free check caches them.
//   3. AI by name: ask about the business by name and address, and whether it could find it.
//
// Run (needs GOOGLE_PLACES_API_KEY and ANTHROPIC_API_KEY in .env.local):
//   npx tsx --env-file=.env.local scripts/study-new-businesses.ts [--max-usd 15] [--per-category 22]
// Writes study-out/results.json (one row per business) and study-out/summary.json (the numbers
// the research page quotes). Re-running resumes from study-out/cache.json, so nothing is paid twice.

import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const OUT = "study-out";
const MODEL = process.env.STUDY_MODEL || process.env.CLAUDE_MODEL || "claude-opus-5-5";
const arg = (name: string, d: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : d;
};
const MAX_USD = arg("max-usd", 15);
const PER_CATEGORY = arg("per-category", 22);

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
if (!PLACES_KEY || !process.env.ANTHROPIC_API_KEY) {
  console.error("Set GOOGLE_PLACES_API_KEY and ANTHROPIC_API_KEY (run with --env-file=.env.local).");
  process.exit(1);
}
const client = new Anthropic();

// ---------- categories ----------
const CATEGORIES: { key: string; label: string; plural: string; test: RegExp }[] = [
  { key: "restaurant", label: "restaurant", plural: "restaurants", test: /retail food|restaurant|food service|consumption on premises/i },
  { key: "hair", label: "hair salon", plural: "hair salons", test: /hair|barber|braid|cosmetolog/i },
  { key: "nails", label: "nail salon", plural: "nail salons", test: /nail|manicur/i },
  { key: "massage-spa", label: "massage or spa", plural: "massage spas", test: /massage|spa\b|esthetic|skin care|body art|waxing|lash/i },
  { key: "fitness", label: "gym or fitness studio", plural: "gyms and fitness studios", test: /fitness|gym|yoga|pilates|health club|martial/i },
  { key: "pet", label: "pet groomer", plural: "pet groomers", test: /animal|pet|groom|kennel|dog/i },
];
const CHAINS = /subway|starbucks|dunkin|mcdonald|portillo|chipotle|qdoba|taco bell|7-eleven|walgreens|cvs|jimmy john|potbelly|domino|papa john|wingstop|great clips|supercuts|european wax|massage envy|planet fitness|orangetheory|petsmart|petco|hotel|inn\b|marriott|hilton/i;

// ---------- cost guard ----------
let usd = 0;
function addUsage(u: Anthropic.Beta.BetaUsage) {
  // Opus 5.5 list prices per token; web searches $10 per 1,000.
  const searches = u.server_tool_use?.web_search_requests ?? 0;
  usd += u.input_tokens * 4e-6 + (u.cache_creation_input_tokens ?? 0) * 5e-6 + (u.cache_read_input_tokens ?? 0) * 0.2e-6 + u.output_tokens * 20e-6 + searches * 0.01;
  console.log(`  usage in=${u.input_tokens} cache_write=${u.cache_creation_input_tokens ?? 0} cache_read=${u.cache_read_input_tokens ?? 0} out=${u.output_tokens} searches=${searches} total=$${usd.toFixed(2)}`);
}

// ---------- cache (resume without paying twice) ----------
const cacheFile = `${OUT}/cache.json`;
mkdirSync(OUT, { recursive: true });
const cache: Record<string, unknown> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
const saveCache = () => writeFileSync(cacheFile, JSON.stringify(cache, null, 1));
async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (key in cache) return cache[key] as T;
  const v = await fn();
  cache[key] = v;
  saveCache();
  return v;
}

// ---------- Claude with web search (prompt caching on, as in the product) ----------
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
const CACHE = { cache_control: { type: "ephemeral" as const } };
const CONSUMER_SYSTEM =
  "You are a helpful assistant answering a local search question. Search the web, then recommend specific businesses by name, like you normally would for a consumer.";
const LOOKUP_SYSTEM =
  "You are a helpful assistant. Search the web to answer questions about a specific local business. If you cannot find reliable information about that exact business, say so plainly instead of guessing or describing a different business.";

async function ask(system: string, prompt: string): Promise<{ text: string; sources: string[] }> {
  if (usd >= MAX_USD) throw new Error(`budget reached ($${usd.toFixed(2)})`);
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  let text = "";
  const sources: string[] = [];
  for (let i = 0; i < 3; i++) {
    const res = await client.beta.messages.create({
      ...FALLBACK,
      ...CACHE,
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "low" },
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3, user_location: { type: "approximate", country: "US", city: "Chicago", region: "IL" } }],
      messages,
    });
    addUsage(res.usage);
    if (res.stop_reason === "refusal") break;
    for (const b of res.content) {
      if (b.type === "text") {
        text += b.text;
        for (const c of b.citations || []) if ("url" in c && c.url) sources.push(c.url);
      }
    }
    if (res.stop_reason !== "pause_turn") break;
    messages.splice(1, messages.length - 1, { role: "assistant", content: res.content });
  }
  return { text, sources: [...new Set(sources)] };
}

// ---------- matching ----------
const STOP = new Set(["the", "and", "of", "llc", "inc", "co", "corp", "chicago", "salon", "spa", "studio", "restaurant", "cafe", "bar", "grill", "kitchen", "nails", "nail", "hair", "inc.", "llc.", "&", "by", "at", "on", "a"]);
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const keyTokens = (name: string) => norm(name).split(" ").filter((t) => t.length > 1 && !STOP.has(t));
function nameMatches(a: string, b: string) {
  const ta = keyTokens(a);
  const tb = new Set(keyTokens(b));
  if (!ta.length || !tb.size) return norm(a) === norm(b);
  const hit = ta.filter((t) => tb.has(t)).length;
  return hit / Math.min(ta.length, tb.size) >= 0.6;
}
/** Is this business named in the answer? Its distinctive words must appear together. */
function namedIn(name: string, answer: string) {
  const toks = keyTokens(name);
  if (!toks.length) return false;
  const text = ` ${norm(answer)} `;
  return text.includes(` ${toks.join(" ")} `) || (toks.length >= 2 && toks.every((t) => text.includes(` ${t} `)));
}
const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};

// ---------- data sources ----------
interface License {
  doing_business_as_name?: string;
  legal_name?: string;
  address?: string;
  zip_code?: string;
  license_description?: string;
  business_activity?: string;
  license_start_date?: string;
  latitude?: string;
  longitude?: string;
}

async function licenses(): Promise<License[]> {
  const day = 86400000;
  const from = new Date(Date.now() - 120 * day).toISOString().slice(0, 10);
  const to = new Date(Date.now() - 30 * day).toISOString().slice(0, 10);
  const where = `application_type='ISSUE' AND license_start_date between '${from}T00:00:00' and '${to}T23:59:59'`;
  const url = `https://data.cityofchicago.org/resource/r5kz-chrr.json?$limit=20000&$where=${encodeURIComponent(where)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Chicago data ${res.status}: ${await res.text()}`);
  return (await res.json()) as License[];
}

interface PlaceHit {
  id: string;
  name: string;
  address: string;
  reviews: number;
  rating: number | null;
  website: string | null;
  status: string | null;
  neighborhood: string | null;
}

async function findOnGoogle(name: string, address: string, at: { lat: number; lng: number } | null): Promise<PlaceHit | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.userRatingCount,places.rating,places.websiteUri,places.businessStatus,places.addressComponents,places.location",
    },
    body: JSON.stringify({
      textQuery: `${name}, ${address}, Chicago, IL`,
      pageSize: 5,
      ...(at ? { locationBias: { circle: { center: { latitude: at.lat, longitude: at.lng }, radius: 500 } } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Places ${res.status}: ${await res.text()}`);
  type P = { id: string; displayName?: { text: string }; formattedAddress?: string; userRatingCount?: number; rating?: number; websiteUri?: string; businessStatus?: string; location?: { latitude: number; longitude: number }; addressComponents?: { longText: string; types: string[] }[] };
  const places = ((await res.json()) as { places?: P[] }).places || [];
  const p = places.find((x) => nameMatches(name, x.displayName?.text || "") && (!at || !x.location || km(at, { lat: x.location.latitude, lng: x.location.longitude }) < 0.4));
  if (!p) return null;
  const hood = p.addressComponents?.find((c) => c.types.includes("neighborhood"))?.longText || null;
  return { id: p.id, name: p.displayName?.text || name, address: p.formattedAddress || address, reviews: p.userRatingCount || 0, rating: p.rating ?? null, website: p.websiteUri || null, status: p.businessStatus || null, neighborhood: hood };
}

// ---------- main ----------
interface Row {
  name: string;
  category: string;
  licensed: string;
  address: string;
  google: PlaceHit | null;
  categoryQuestion: string | null;
  namedForCategory: boolean | null;
  namesInCategoryAnswer: number | null;
  nameQuestionFound: boolean | null;
  error?: string;
}

function pickSample(all: License[]) {
  const seen = new Set<string>();
  const out: { lic: License; cat: (typeof CATEGORIES)[number] }[] = [];
  // Deterministic shuffle so a re-run picks the same businesses.
  const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const sorted = [...all].sort((a, b) => hash(a.doing_business_as_name || "") - hash(b.doing_business_as_name || ""));
  for (const cat of CATEGORIES) {
    let n = 0;
    for (const lic of sorted) {
      const name = (lic.doing_business_as_name || lic.legal_name || "").trim();
      const what = `${lic.license_description || ""} ${lic.business_activity || ""}`;
      if (!name || CHAINS.test(name) || !cat.test.test(what)) continue;
      const k = norm(name);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ lic, cat });
      if (++n >= PER_CATEGORY) break;
    }
  }
  return out;
}

async function main() {
  const all = await cached("licenses", licenses);
  const sample = pickSample(all);
  console.log(`${all.length} new licenses, ${sample.length} sampled. Budget $${MAX_USD}.`);
  const rows: Row[] = [];
  for (const { lic, cat } of sample) {
    const name = (lic.doing_business_as_name || lic.legal_name || "").trim();
    const address = (lic.address || "").trim();
    const at = lic.latitude && lic.longitude ? { lat: Number(lic.latitude), lng: Number(lic.longitude) } : null;
    const row: Row = { name, category: cat.key, licensed: (lic.license_start_date || "").slice(0, 10), address, google: null, categoryQuestion: null, namedForCategory: null, namesInCategoryAnswer: null, nameQuestionFound: null };
    console.log(`\n${name} (${cat.label}, ${address})`);
    try {
      row.google = await cached(`places:${name}|${address}`, () => findOnGoogle(name, address, at));
      if (row.google?.status === "CLOSED_PERMANENTLY") continue;
      const area = row.google?.neighborhood || null;
      const q = `What are the best ${cat.plural} in ${area ? `${area}, ` : ""}Chicago? Give me a few specific places.`;
      row.categoryQuestion = q;
      const ans = await cached(`cat:${q}`, () => ask(CONSUMER_SYSTEM, q));
      row.namedForCategory = namedIn(name, ans.text) || (!!row.google && namedIn(row.google.name, ans.text));
      row.namesInCategoryAnswer = (ans.text.match(/^\s*(\d+[.)]|[-*•])\s+/gm) || []).length || null;
      const look = await cached(`name:${name}|${address}`, () =>
        ask(LOOKUP_SYSTEM, `Tell me about ${name}, the ${cat.label} at ${address}, Chicago. What do they offer and what do people say about it? Start your answer with FOUND if you found information about this exact business, or NOT FOUND if you could not.`),
      );
      row.nameQuestionFound = /^\W*found\b/i.test(look.text.trim()) ? true : /^\W*not found\b/i.test(look.text.trim()) ? false : namedIn(name, look.text);
    } catch (e) {
      row.error = String(e);
      console.error("  ", row.error);
      if (String(e).includes("budget reached")) {
        rows.push(row);
        break;
      }
    }
    rows.push(row);
  }

  writeFileSync(`${OUT}/results.json`, JSON.stringify(rows, null, 1));
  const done = rows.filter((r) => !r.error);
  const pct = (n: number, d: number) => (d ? Math.round((1000 * n) / d) / 10 : 0);
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
  };
  const onGoogle = done.filter((r) => r.google);
  const byCat = Object.fromEntries(
    CATEGORIES.map((c) => {
      const rs = done.filter((r) => r.category === c.key);
      return [c.key, { n: rs.length, onGoogle: pct(rs.filter((r) => r.google).length, rs.length), namedForCategory: pct(rs.filter((r) => r.namedForCategory).length, rs.length), foundByName: pct(rs.filter((r) => r.nameQuestionFound).length, rs.length) }];
    }),
  );
  const summary = {
    ranAt: new Date().toISOString(),
    model: MODEL,
    source: "City of Chicago business licenses (data.cityofchicago.org, dataset r5kz-chrr), new licenses issued 30 to 120 days before the run",
    licensesInWindow: all.length,
    sampled: done.length,
    onGoogleMaps: pct(onGoogle.length, done.length),
    zeroReviews: pct(onGoogle.filter((r) => r.google!.reviews === 0).length, onGoogle.length),
    under10Reviews: pct(onGoogle.filter((r) => r.google!.reviews < 10).length, onGoogle.length),
    medianReviews: median(onGoogle.map((r) => r.google!.reviews)),
    withWebsite: pct(onGoogle.filter((r) => r.google!.website).length, onGoogle.length),
    namedForCategory: pct(done.filter((r) => r.namedForCategory).length, done.length),
    foundByName: pct(done.filter((r) => r.nameQuestionFound).length, done.length),
    foundByNameIfOnGoogle: pct(onGoogle.filter((r) => r.nameQuestionFound).length, onGoogle.length),
    foundByNameIfNotOnGoogle: pct(done.filter((r) => !r.google && r.nameQuestionFound).length, done.filter((r) => !r.google).length),
    namedForCategoryWithWebsite: pct(onGoogle.filter((r) => r.google!.website && r.namedForCategory).length, onGoogle.filter((r) => r.google!.website).length),
    namedForCategoryNoWebsite: pct(done.filter((r) => !r.google?.website && r.namedForCategory).length, done.filter((r) => !r.google?.website).length),
    byCategory: byCat,
    costUsd: Math.round(usd * 100) / 100,
  };
  writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 1));
  console.log("\n", JSON.stringify(summary, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
