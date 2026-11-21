// Reading a business's homepage HTML. Pure functions (no network), so the tricky-lead tests can run them.
import { termFromSite } from "./industries";

/**
 * Website builders (Wix, Squarespace) put 1 to 6 MB of scripts in the <head>, before any visible text.
 * We read up to this much of the page, then drop scripts and styles, so the footer phone and the
 * body words aren't cut off (IMpossible Pilates' phone sits 950 KB in; Body Mind Stretch's text 4.8 MB in).
 */
export const MAX_HTML = 8_000_000;

/** Visible text of the page: scripts, styles and tags removed. */
export function pageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** The page title, meta and social descriptions and first headings: how the owner sums up the business. */
export function headline(html: string): string {
  const parts = [
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
    ...[...html.matchAll(/<meta[^>]+(?:name|property)=["'](?:description|og:title|og:description)["'][^>]*>/gi)].map((m) => m[0].match(/content=["']([^"']*)["']/i)?.[1]),
    ...[...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].slice(0, 2).map((m) => m[1]),
  ];
  return parts.filter(Boolean).join(" ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

/** Does the page show this phone number (last 10 digits)? null when there's no number to look for. */
export function showsPhone(text: string, phone?: string): boolean | null {
  const want = (phone || "").replace(/\D/g, "").slice(-10);
  if (want.length !== 10) return null;
  const digits = text.replace(/\D/g, "");
  return digits.includes(want);
}

/**
 * What kind of business the website says it is, in the words customers search, for any industry.
 * Used to suggest a business type when Google's category doesn't fit. Most specific first.
 */
const KINDS: [RegExp, string][] = [
  [/\bmed(ical)?\s?spa\b/, "med spa"],
  [/\bdanc(e|es|ing)\b|\bballet\b|\bhip[\s-]?hop\b/, "dance studio"],
  [/\bmartial arts?\b|\bkarate\b|\btae ?kwon ?do\b|\bjiu[\s-]?jitsu\b|\bkung fu\b/, "martial arts school"],
  [/\bgymnastics\b|\btumbling\b|\bcheer(leading)?\b/, "gymnastics school"],
  [/\bswim(ming)? (lessons?|school|classes)\b/, "swim school"],
  [/\b(piano|guitar|violin|voice|music) (lessons?|school|teacher|classes)\b/, "music lessons"],
  [/\btutor(ing|s)?\b|\btest prep\b/, "tutoring"],
  [/\b(art|painting|pottery|ceramics) (classes|studio|lessons)\b/, "art classes"],
  [/\bpilates\b/, "pilates studio"],
  [/\byoga\b/, "yoga studio"],
  [/\bchiropract\w*/, "chiropractor"],
  [/\bphysical therap\w*|\bphysiotherap\w*/, "physical therapist"],
  [/\bacupunct\w*/, "acupuncturist"],
  [/\bmassage\b/, "massage therapist"],
  [/\bassisted stretch\w*|\bstretch therap\w*/, "assisted stretching"],
  [/\bhealth coach\w*/, "health coach"],
  [/\b(wellness|life|somatic|holistic) coach\w*/, "wellness coach"],
  [/\bpersonal train\w*/, "personal trainer"],
  [/\bnutrition\w*|\bdietitian\b/, "nutritionist"],
  [/\b(dog|pet|cat) groom\w*|\bgroomer\b/, "dog groomer"],
  [/\bdog train\w*/, "dog trainer"],
  [/\bnail (salon|art|tech)\b|\bmanicure/, "nail salon"],
  [/\bbarber/, "barber shop"],
  [/\bhair (salon|stylist)\b/, "hair salon"],
  [/\blash(es)? (extension|studio)\w*/, "lash studio"],
  [/\bhouse ?clean\w*|\bmaid service\b/, "house cleaner"],
  [/\bplumb\w*/, "plumber"],
  [/\bfood truck\b/, "food truck"],
  [/\bcater(ing|er)\b/, "caterer"],
  [/\bbakery\b/, "bakery"],
  [/\bcoffee (shop|house)\b|\bcaf[eé]\b/, "cafe"],
];

export function kindFromSite(text: string, head = ""): string | undefined {
  const h = head.toLowerCase();
  const lead = KINDS.find(([re]) => re.test(h));
  if (lead) return lead[1];
  const t = text.toLowerCase();
  const scored = KINDS.map(([re, kind]) => ({ kind, n: (t.match(new RegExp(re.source, "g")) || []).length })).sort((a, b) => b.n - a.n);
  return scored[0]?.n >= 3 ? scored[0].kind : undefined;
}

/** Words in a category name that say nothing about the kind of business. */
const FILLER = new Set(["and", "or", "of", "the", "a", "an", "for", "service", "services", "store", "shop", "school", "center", "centre", "studio", "company", "agency", "office", "business", "provider", "place", "establishment", "organization", "association", "point", "interest", "&", "/"]);

/**
 * Do the words in Google's category show up on the website at all? "Sports School" on a site that
 * never says "sports" means Google has the wrong idea. null when the category has no telling words.
 */
export function labelOnSite(label: string | undefined, text: string, head = ""): boolean | null {
  if (!label) return null;
  const words = label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !FILLER.has(w));
  if (!words.length) return null;
  const hay = `${head} ${text}`.toLowerCase();
  // Match on the stem ("chiropractor" vs "chiropractic", "groomer" vs "grooming").
  return words.some((w) => hay.includes(w.length > 6 ? w.slice(0, w.length - 2) : w));
}

/** Everything the free check takes from the homepage HTML itself. */
export function homepageFacts(html: string, place: { phone?: string; primaryTypeLabel?: string }) {
  const text = pageText(html);
  const head = headline(html);
  // tel: links count too: some sites only show a "Call us" button.
  const tels = [...html.matchAll(/href=["']tel:([^"']+)/gi)].map((m) => m[1]).join(" ");
  return {
    text,
    head,
    phone: showsPhone(`${text} ${tels}`, place.phone),
    termHint: termFromSite(text, head),
    kind: kindFromSite(text, head),
    labelSeen: labelOnSite(place.primaryTypeLabel, text, head),
  };
}
