import "server-only";
import { z } from "zod";
import { getJSON, setJSON } from "./kv";
import { SITE_URL } from "./site";

// A free one-page website at mapdebut.com/b/<slug> for Kit buyers who don't have a website yet.
// Gemini and Perplexity read business websites far more than anything else, so a real page with
// services, prices, areas and an FAQ (plus schema) gives a brand-new business something to cite.
// The owner reviews every word before publishing: no [bracket] placeholders can go live.

export const RESERVED = new Set(["admin", "api", "kit", "new", "test", "mapdebut", "support", "help", "about", "login", "signin"]);
const BRACKET = /\[[^\]]{1,80}\]/;
const noBrackets = (s: string) => !BRACKET.test(s);
const text = (max: number) => z.string().trim().max(max).refine(noBrackets, "Fill in or delete every [bracket] first.");

export const SiteInput = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,48})[a-z0-9]$/, "Use 3 to 50 letters, numbers and dashes.").refine((s) => !RESERVED.has(s), "That address is taken."),
  intro: text(1200).pipe(z.string().min(40, "Write at least a couple of sentences about the business.")),
  phone: text(40),
  booking: z.union([z.literal(""), z.string().trim().url("The booking link must start with https://").max(300)]),
  services: z.array(z.object({ name: text(80).pipe(z.string().min(2)), description: text(400) })).min(1, "List at least one service.").max(12),
  prices: z.array(z.object({ item: text(80), price: text(40) })).max(20),
  facts: z.array(text(200)).max(12),
  areas: text(300),
  hours: text(300),
  faq: z.array(z.object({ q: text(200), a: text(800) })).max(10),
});
export type SiteInputT = z.infer<typeof SiteInput>;

export interface HostedSite extends SiteInputT {
  key: string; // the Kit it belongs to
  name: string;
  city: string;
  address: string;
  serviceArea: boolean;
  placeId: string;
  publishedAt: string;
  updatedAt: string;
}

const siteKey = (slug: string) => `site:${slug}`;
const ownerKey = (kitKey: string) => `sitekey:${kitKey}`;
const INDEX = "sites:index";

export const siteUrl = (slug: string) => `${SITE_URL}/b/${slug}`;
export const getSite = (slug: string) => getJSON<HostedSite>(siteKey(slug));
export async function siteForKit(kitKey: string): Promise<HostedSite | null> {
  const slug = await getJSON<string>(ownerKey(kitKey));
  const s = slug ? await getSite(slug) : null;
  return s && s.key === kitKey ? s : null;
}

export async function publishedSlugs(): Promise<string[]> {
  return (await getJSON<string[]>(INDEX)) || [];
}

/** Saves (or moves) the Kit's page. Returns an error message when the address belongs to someone else. */
export async function publishSite(site: Omit<HostedSite, "publishedAt" | "updatedAt">): Promise<{ ok: true; site: HostedSite } | { ok: false; error: string }> {
  const taken = await getSite(site.slug);
  if (taken && taken.key !== site.key) return { ok: false, error: "That address is taken. Try adding your town, like bella-nails-plano." };
  const prev = await siteForKit(site.key);
  const now = new Date().toISOString();
  const saved: HostedSite = { ...site, publishedAt: prev?.publishedAt || taken?.publishedAt || now, updatedAt: now };
  await setJSON(siteKey(site.slug), saved);
  await setJSON(ownerKey(site.key), site.slug);
  const index = new Set(await publishedSlugs());
  if (prev && prev.slug !== site.slug) {
    await setJSON(siteKey(prev.slug), null, 60); // old address stops working
    index.delete(prev.slug);
  }
  index.add(site.slug);
  await setJSON(INDEX, [...index]);
  return { ok: true, site: saved };
}

export async function unpublishSite(kitKey: string) {
  const prev = await siteForKit(kitKey);
  if (!prev) return;
  await setJSON(siteKey(prev.slug), null, 60);
  await setJSON(ownerKey(kitKey), null, 60);
  await setJSON(INDEX, (await publishedSlugs()).filter((s) => s !== prev.slug));
}

// ---------- The page ----------

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const paras = (s: string) => s.split(/\n\s*\n/).map((b) => `<p>${esc(b.trim()).replace(/\n/g, "<br>")}</p>`).join("\n");
const tel = (p: string) => p.replace(/[^\d+]/g, "");
const json = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

export function renderSite(s: HostedSite): string {
  const url = siteUrl(s.slug);
  const town = s.city.split(",")[0].trim();
  const title = `${s.name}${town ? ` in ${town}` : ""}`;
  const description = s.intro.replace(/\s+/g, " ").slice(0, 155);
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: s.name,
    url,
    description,
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.serviceArea ? {} : s.address ? { address: { "@type": "PostalAddress", streetAddress: s.address } } : {}),
    ...(s.areas ? { areaServed: s.areas.split(/[,;\n]+/).map((a) => a.trim()).filter(Boolean) } : {}),
    ...(s.placeId && s.placeId !== "new" ? { hasMap: `https://www.google.com/maps/place/?q=place_id:${s.placeId}` } : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: s.services.map((x) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: x.name, ...(x.description ? { description: x.description } : {}) } })),
    },
  };
  const faq = s.faq.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: s.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) } : null;
  const cta = s.booking
    ? `<a class="btn" href="${esc(s.booking)}" rel="noopener">Book now</a>${s.phone ? ` <a class="btn ghost" href="tel:${esc(tel(s.phone))}">Call ${esc(s.phone)}</a>` : ""}`
    : s.phone
      ? `<a class="btn" href="tel:${esc(tel(s.phone))}">Call or text ${esc(s.phone)}</a>`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="website">
<script type="application/ld+json">${json(schema)}</script>
${faq ? `<script type="application/ld+json">${json(faq)}</script>` : ""}
<style>
  :root { --paper:#f4efe6; --card:#fbf8f2; --ink:#1c1a16; --ink2:#4a453d; --line:#ddd3c2; --accent:#b4441a; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font:18px/1.6 system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif; }
  .wrap { max-width:760px; margin:0 auto; padding:40px 16px 56px; }
  h1 { font:600 clamp(2rem,6vw,2.8rem)/1.15 Georgia,"Times New Roman",serif; margin:0 0 8px; }
  h2 { font:600 1.5rem/1.25 Georgia,"Times New Roman",serif; margin:40px 0 12px; }
  h3 { font-size:1.05rem; margin:0 0 4px; }
  p { margin:0 0 12px; color:var(--ink2); }
  .where { color:var(--ink2); margin-bottom:20px; }
  .btn { display:inline-block; background:var(--ink); color:var(--paper); padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:600; margin:4px 8px 4px 0; }
  .btn.ghost { background:transparent; color:var(--ink); border:1px solid var(--ink); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px 18px; margin:10px 0; }
  table { width:100%; border-collapse:collapse; } td { padding:10px 4px; border-top:1px solid var(--line); } td+td { text-align:right; white-space:nowrap; font-weight:600; }
  ul.facts { padding-left:20px; color:var(--ink2); }
  details { border-top:1px solid var(--line); padding:12px 0; } summary { cursor:pointer; font-weight:600; }
  footer { margin-top:56px; font-size:14px; color:#6b6459; } footer a { color:inherit; }
</style>
</head>
<body>
<div class="wrap">
<header>
<h1>${esc(s.name)}</h1>
<p class="where">${esc(s.serviceArea ? `Serving ${s.areas || s.city}` : s.address || s.city)}</p>
${cta ? `<p>${cta}</p>` : ""}
</header>
<main>
<section>${paras(s.intro)}</section>
<section>
<h2>Services</h2>
${s.services.map((x) => `<div class="card" id="${esc(x.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}"><h3>${esc(x.name)}</h3>${x.description ? `<p>${esc(x.description)}</p>` : ""}</div>`).join("\n")}
</section>
${s.prices.length ? `<section><h2>Prices</h2><table>${s.prices.map((x) => `<tr><td>${esc(x.item)}</td><td>${esc(x.price)}</td></tr>`).join("")}</table></section>` : ""}
${s.facts.length ? `<section><h2>Good to know</h2><ul class="facts">${s.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>` : ""}
${s.areas ? `<section><h2>Areas we serve</h2><p>${esc(s.areas)}</p></section>` : ""}
${s.hours ? `<section><h2>Hours</h2><p>${esc(s.hours).replace(/\n/g, "<br>")}</p></section>` : ""}
${s.faq.length ? `<section><h2>Questions</h2>${s.faq.map((x) => `<details open><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join("")}</section>` : ""}
${cta ? `<section><h2>Get in touch</h2><p>${cta}</p></section>` : ""}
</main>
<footer>Page made with <a href="${SITE_URL}/?ref=b">MapDebut</a>.</footer>
</div>
</body>
</html>`;
}
