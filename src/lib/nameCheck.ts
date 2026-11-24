// Free tool: does this Google Business Profile name break Google's name rules?
// Pure and client-safe (no API calls). Rules follow Google's "Guidelines for representing
// your business on Google": the name must match real-world signage and not add keywords,
// locations, hours, phone numbers, URLs, taglines or special characters.

export type Level = "high" | "medium" | "low";

export interface NameIssue {
  level: Level;
  title: string;
  why: string;
  match?: string;
}

export interface NameResult {
  risk: "high" | "medium" | "low" | "none";
  issues: NameIssue[];
  suggestion: string | null; // the name with the risky parts removed, when we can tell
}

const PROMO = [
  "best", "#1", "no. 1", "number one", "top rated", "top-rated", "cheap", "cheapest", "affordable", "discount",
  "award winning", "award-winning", "near me", "low cost", "lowest", "guaranteed", "certified", "licensed", "insured",
  "same day", "same-day", "emergency", "premier", "luxury", "trusted",
];
const HOURS = ["24/7", "24 hours", "24hr", "24-hour", "open now", "open late", "open daily", "now open", "grand opening", "closed"];
// Service words that often get stuffed after the real name. Fine when part of the brand on the sign.
const SERVICES = [
  "plumber", "plumbing", "hvac", "heating", "cooling", "air conditioning", "ac repair", "electrician", "electrical", "roofing", "roofer",
  "cleaning", "cleaners", "maid", "maids", "house cleaning", "carpet cleaning", "pest control", "landscaping", "lawn care", "handyman",
  "locksmith", "towing", "moving", "movers", "painting", "remodeling", "garage door", "pressure washing", "junk removal",
  "nail salon", "nails", "hair salon", "barber", "barbershop", "lash", "lashes", "brows", "waxing", "spa", "med spa", "botox", "facial",
  "massage", "chiropractor", "chiropractic", "acupuncture", "physical therapy", "yoga", "pilates", "fitness", "gym", "personal trainer",
  "dentist", "dental", "therapy", "counseling",
  "dog grooming", "pet grooming", "groomer", "grooming", "dog walking", "pet sitting", "dog training", "boarding", "daycare", "vet", "veterinary",
  "restaurant", "pizza", "tacos", "sushi", "bbq", "burgers", "coffee", "cafe", "bakery", "bar", "grill", "catering", "food truck",
];
const ALLOWED_SHORT_CAPS = new Set(["LLC", "INC", "CO", "BBQ", "HVAC", "USA", "DDS", "MD", "PT", "AC", "TV", "&"]);

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = (w: string) => new RegExp(`(^|[^a-z0-9])${esc(w)}($|[^a-z0-9])`, "i");

export function checkBusinessName(raw: string, opts: { city?: string; onSignage?: boolean } = {}): NameResult {
  const name = raw.trim().replace(/\s+/g, " ");
  const issues: NameIssue[] = [];
  if (!name) return { risk: "none", issues, suggestion: null };
  const lower = name.toLowerCase();
  let cut = name;
  const cutPart = (re: RegExp) => (cut = cut.replace(re, " ").replace(/\s+/g, " ").trim());

  const phone = name.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  if (phone) {
    issues.push({ level: "high", title: "Phone number in the name", why: "Google never allows phone numbers in the business name. Put it in the phone field.", match: phone[0] });
    cutPart(new RegExp(esc(phone[0])));
  }

  const url = name.match(/\b[\w-]+\.(com|net|org|co|io|biz|us)\b|https?:\/\/\S+|www\.\S+/i);
  if (url) {
    issues.push({ level: "high", title: "Website address in the name", why: "URLs aren't allowed in the name unless the web address is literally your brand on the sign. Put it in the website field.", match: url[0] });
    cutPart(new RegExp(esc(url[0]), "i"));
  }

  for (const h of HOURS) {
    if (word(h).test(lower) || (h.includes("/") && lower.includes(h))) {
      issues.push({ level: "high", title: "Hours or opening status in the name", why: "Hours and words like \"open 24/7\" or \"now open\" belong in the hours field, not the name.", match: h });
      cutPart(new RegExp(esc(h), "i"));
    }
  }

  const promos = PROMO.filter((p) => (p.startsWith("#") || p.includes(".") ? lower.includes(p) : word(p).test(lower)));
  if (promos.length) {
    issues.push({
      level: "high",
      title: "Marketing words in the name",
      why: "Words like \"best\", \"#1\", \"affordable\" or \"licensed\" are taglines, and they're a top reason new profiles get suspended. Use your description for these.",
      match: promos.join(", "),
    });
    for (const p of promos) cutPart(new RegExp(esc(p), "i"));
  }

  const sep = name.match(/\s[|–—-]\s|\s?\|\s?|:\s/);
  if (sep) {
    const after = name.slice((sep.index ?? 0) + sep[0].length);
    issues.push({
      level: "high",
      title: "Extra words after a separator",
      why: `Text after "${sep[0].trim()}" usually reads as added keywords or a location. Google's reviewers look for exactly this pattern.`,
      match: after,
    });
    cut = cut.split(sep[0].trim())[0].trim();
  }

  if (opts.city) {
    const c = opts.city.trim().toLowerCase();
    if (c.length > 2 && word(c).test(lower)) {
      issues.push({
        level: opts.onSignage ? "low" : "medium",
        title: "Your city or area is in the name",
        why: opts.onSignage
          ? "Fine if it's really on your sign and license, but be ready to prove it with a photo if Google asks."
          : "Location words are only allowed when they're part of your real brand. Otherwise they count as keyword stuffing.",
        match: opts.city.trim(),
      });
      if (!opts.onSignage) cutPart(new RegExp(`\\b(in\\s+)?${esc(opts.city.trim())}\\b`, "i"));
    }
  }

  const services = SERVICES.filter((s) => word(s).test(lower));
  const serviceHits = services.filter((s) => !services.some((o) => o !== s && o.includes(s)));
  if (serviceHits.length >= 2) {
    issues.push({
      level: opts.onSignage ? "low" : "medium",
      title: "Several service keywords",
      why: "One service word that's part of your brand is normal (\"Rosa's Nails\"). Two or more often looks like stuffing. Your categories and services fields do this job instead.",
      match: serviceHits.join(", "),
    });
  }

  const odd = name.match(/[^\p{L}\p{N}\s&'’.,!?()/+#|:–—-]/gu);
  if (odd) {
    issues.push({ level: "medium", title: "Special characters or emoji", why: "Symbols like ★, ™ or emoji aren't allowed. \"&\" is fine.", match: [...new Set(odd)].join(" ") });
    cut = cut.replace(/[^\p{L}\p{N}\s&'’.,!?()/+-]/gu, "").replace(/\s+/g, " ").trim();
  }

  const words = name.split(/\s+/).filter((w) => /[A-Z]/.test(w) && w.replace(/[^A-Za-z]/g, "").length >= 4);
  const shouting = words.filter((w) => w === w.toUpperCase() && !ALLOWED_SHORT_CAPS.has(w.replace(/[^A-Za-z&]/g, "")));
  if (shouting.length && shouting.length === words.length) {
    issues.push({ level: "low", title: "All capital letters", why: "Use normal capitalization unless your brand is styled that way on the sign. Google may change it for you." });
  }

  if (/\b(llc|inc|corp|corporation|ltd|l\.l\.c\.)\b\.?/i.test(name)) {
    issues.push({ level: "low", title: "Legal ending (LLC, Inc)", why: "Allowed, but only include it if customers see it on your sign. Most businesses leave it off." });
  }

  if (name.length > 45) {
    issues.push({ level: "medium", title: "Long name", why: `At ${name.length} characters this is longer than most real storefront names, which is a common sign of added keywords.` });
  }

  const order: Level[] = ["high", "medium", "low"];
  issues.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  const risk = issues.length ? issues[0].level : "none";
  cut = cut.replace(/^[\s,.\-|:]+|[\s,.\-|:]+$/g, "").replace(/\s+/g, " ");
  const suggestion = cut && cut.toLowerCase() !== name.toLowerCase() ? cut : null;
  return { risk, issues, suggestion };
}
