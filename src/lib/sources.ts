// Turns a raw first-touch source (referrer host or utm/ref tags) into a name a person can read,
// grouped into a channel. Shared by the browser (to read the source) and the server (to name it).

/** Hosts that are never a real source: our own site, and the payment pages people come back from. */
const IGNORE = [/(^|\.)mapdebut\.com$/, /(^|\.)stripe\.com$/, /^localhost$/, /\.vercel\.app$/, /^127\.0\.0\.1$/];
export const ignoredHost = (h: string) => IGNORE.some((r) => r.test(h));

export interface RawSource { src: string; medium?: string; campaign?: string }

/** In the browser: what brought this visit here, or null for a direct visit. */
export function readSource(search: string, referrer: string): RawSource | null {
  const q = new URLSearchParams(search);
  const clean = (s: string | null) => (s || "").trim().toLowerCase().replace(/[^a-z0-9._\-/ ]/g, "").slice(0, 40);
  const tagged = clean(q.get("utm_source") || q.get("ref") || q.get("via") || q.get("source"));
  const medium = clean(q.get("utm_medium"));
  const campaign = clean(q.get("utm_campaign"));
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, "").toLowerCase() : "";
  } catch {}
  if (host && ignoredHost(host)) host = "";
  const click = q.get("gclid") || q.get("gbraid") || q.get("wbraid") ? "google-ads" : q.get("msclkid") ? "bing-ads" : q.get("fbclid") ? "facebook" : "";
  const src = tagged || click || host;
  if (!src || ignoredHost(src)) return null;
  return { src, ...(medium ? { medium } : {}), ...(campaign ? { campaign } : {}) };
}

export const CHANNELS = ["AI assistants", "Search", "Ads", "Social", "Email", "Other sites", "Direct"] as const;
export type Channel = (typeof CHANNELS)[number];

const RULES: [RegExp, string, Channel][] = [
  [/^mail\.|webmail|outlook|newsletter|^email$|resend/, "Email", "Email"],
  [/chatgpt|openai/, "ChatGPT", "AI assistants"],
  [/perplexity/, "Perplexity", "AI assistants"],
  [/^claude(\.ai)?$|anthropic/, "Claude", "AI assistants"],
  [/gemini|bard\.google/, "Gemini", "AI assistants"],
  [/copilot/, "Copilot", "AI assistants"],
  [/you\.com|phind|kagi\.com\/assistant|meta\.ai|grok/, "Other AI assistant", "AI assistants"],
  [/google-ads|^adwords|googleads/, "Google Ads", "Ads"],
  [/bing-ads/, "Bing Ads", "Ads"],
  [/^google(\.|$)|\.google\./, "Google search", "Search"],
  [/^bing(\.|$)/, "Bing search", "Search"],
  [/duckduckgo/, "DuckDuckGo", "Search"],
  [/yahoo|ecosia|brave|yandex|baidu|kagi|startpage|qwant/, "Other search", "Search"],
  [/^(x|t)\.co$|^x\.com$|twitter/, "X / Twitter", "Social"],
  [/reddit/, "Reddit", "Social"],
  [/facebook|^fb(\.|$)|^m\.facebook|^l\.facebook/, "Facebook", "Social"],
  [/instagram/, "Instagram", "Social"],
  [/linkedin|^lnkd\.in/, "LinkedIn", "Social"],
  [/youtube|youtu\.be/, "YouTube", "Social"],
  [/tiktok/, "TikTok", "Social"],
  [/threads\.net|threads/, "Threads", "Social"],
  [/nextdoor/, "Nextdoor", "Social"],
  [/^b$/, "Kit buyer pages (made with MapDebut)", "Other sites"],
  [/producthunt/, "Product Hunt", "Other sites"],
  [/ycombinator|hacker ?news|^hn$/, "Hacker News", "Other sites"],
  [/indiehackers/, "Indie Hackers", "Other sites"],
  [/explee/, "Explee email", "Email"],
];

export interface Named { name: string; channel: Channel }

/** Server side: a readable name and channel. Direct visits come back as "Direct". */
export function nameSource(raw: RawSource | null | undefined): Named {
  if (!raw?.src) return { name: "Direct or unknown", channel: "Direct" };
  const s = raw.src.toLowerCase();
  const medium = (raw.medium || "").toLowerCase();
  let hit = RULES.find(([re]) => re.test(s));
  if (!hit && /email|newsletter/.test(medium)) hit = [/./, "Email", "Email"];
  if (!hit && /cpc|ppc|paid/.test(medium)) hit = [/./, s, "Ads"];
  const base = hit ? hit[1] : s;
  const channel: Channel = hit ? hit[2] : /social/.test(medium) ? "Social" : "Other sites";
  const name = raw.campaign ? `${base} · ${raw.campaign}` : base;
  return { name: name.slice(0, 60), channel };
}

// The first-touch source is kept in a cookie so later steps (free check, checkout, payment) can be credited to it.
export const SOURCE_COOKIE = "md_src";
export const encodeSource = (r: RawSource) => [r.src, r.medium || "", r.campaign || ""].map(encodeURIComponent).join("|");
export function decodeSource(v: string | undefined | null): RawSource | null {
  if (!v) return null;
  try {
    const [src, medium, campaign] = v.split("|").map((x) => decodeURIComponent(x || ""));
    return src ? { src: src.slice(0, 40), medium: medium?.slice(0, 40) || undefined, campaign: campaign?.slice(0, 40) || undefined } : null;
  } catch {
    return null;
  }
}

/** "Name|Channel": how a source is stored in the counters. */
export const sourceKey = (n: Named) => `${n.name}|${n.channel}`;
