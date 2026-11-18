import { strToU8, zipSync } from "fflate";
import type { LaunchKit, OwnerProfile } from "./types";

// The Kit's website pack as real files, built in the browser (no server cost): plain HTML pages
// with the business schema inside, and a WordPress import file. Fill-in [brackets] are kept and
// highlighted so the owner sees what to change.

export interface SitePage {
  slug: string; // file name without .html
  title: string;
  html: string; // body content only
  schema?: string; // extra JSON-LD for this page
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const mark = (s: string) => esc(s).replace(/\[([^\]]{1,80})\]/g, '<mark>[$1]</mark>');
export const cleanSlug = (s: string) => s.toLowerCase().replace(/^\/+/, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "page";

/** Plain text with blank-line paragraphs and "- " bullets, as HTML. */
export function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length && lines.every((l) => /^[-•*]\s+/.test(l))) return `<ul>\n${lines.map((l) => `  <li>${mark(l.replace(/^[-•*]\s+/, ""))}</li>`).join("\n")}\n</ul>`;
      return `<p>${lines.map(mark).join("<br>\n")}</p>`;
    })
    .join("\n");
}

export function sitePages(kit: LaunchKit, p: OwnerProfile, menuWord = "Services"): SitePage[] {
  const pages: SitePage[] = [];
  for (const s of kit.servicePages || []) pages.push({ slug: cleanSlug(s.slug), title: s.title, html: textToHtml(s.body) });
  if (kit.areaPage) pages.push({ slug: cleanSlug(kit.areaPage.slug), title: kit.areaPage.title, html: textToHtml(kit.areaPage.body) });
  if (kit.priceMenu?.length || kit.facts?.length) {
    pages.push({
      slug: "prices",
      title: `${menuWord === "menu" ? "Menu and prices" : "Prices"} at ${p.name}`,
      html: [
        kit.priceMenu?.length ? `<table>\n${kit.priceMenu.map((x) => `  <tr><td>${mark(x.item)}</td><td>${mark(x.price)}</td></tr>`).join("\n")}\n</table>` : "",
        kit.facts?.length ? `<h2>Good to know</h2>\n<ul>\n${kit.facts.map((f) => `  <li>${mark(f)}</li>`).join("\n")}\n</ul>` : "",
      ].filter(Boolean).join("\n"),
    });
  }
  if (kit.qa.length) {
    const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: kit.qa.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) };
    pages.push({
      slug: "faq",
      title: `Questions about ${p.name}`,
      html: kit.qa.map((x) => `<h2>${mark(x.q)}</h2>\n${textToHtml(x.a)}`).join("\n"),
      schema: `<script type="application/ld+json">\n${JSON.stringify(faq, null, 2)}\n</script>`,
    });
  }
  return pages;
}

function htmlFile(page: SitePage, p: OwnerProfile, schema: string, all: SitePage[], description: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)} | ${esc(p.name)}</title>
<meta name="description" content="${esc(description.slice(0, 160))}">
${schema}
${page.schema || ""}
<style>
  body { font: 18px/1.6 system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif; color: #1c1a16; max-width: 720px; margin: 0 auto; padding: 24px 16px 64px; }
  header a, nav a { color: inherit; } nav { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 8px 0 32px; font-size: 15px; }
  h1 { font-size: 2rem; line-height: 1.2; } h2 { font-size: 1.25rem; margin-top: 2rem; }
  table { border-collapse: collapse; width: 100%; } td { border-top: 1px solid #ddd; padding: 8px 4px; } td + td { text-align: right; white-space: nowrap; }
  mark { background: #fff1b8; }
</style>
</head>
<body>
<header><strong><a href="index.html">${esc(p.name)}</a></strong>${p.phone ? ` · <a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">${esc(p.phone)}</a>` : ""}</header>
<nav>${all.map((x) => `<a href="${x.slug}.html">${esc(x.title)}</a>`).join("\n")}</nav>
<main>
<h1>${esc(page.title)}</h1>
${page.html}
</main>
</body>
</html>
`;
}

const README = (p: OwnerProfile) => `Website pages for ${p.name}, from your MapDebut Launch Kit
================================================================

Before you publish: replace every highlighted [bracket] with your real details, or delete
that line. Never publish a license number, price or claim you don't have.

What's in here
- One page per service, an "areas we serve" page, a prices page and an FAQ page (.html).
- index.html: a simple home page that links them all.
- wordpress-import.xml: the same pages for WordPress.

WordPress
  Tools > Import > WordPress > upload wordpress-import.xml. The pages arrive as drafts, so
  you can fill in the [brackets] and publish. Then paste the business schema (from your Kit)
  into a header-code plugin such as WPCode, so it appears on every page.

Wix, Squarespace, GoDaddy, Shopify and others
  These don't import files. In your Kit, use "Copy formatted" next to each page and paste
  it into a new page: headings and lists keep their format. Paste the business schema
  into Settings > Custom code (Wix) or Settings > Advanced > Code injection (Squarespace).

Your own host or a developer
  Upload the .html files as they are, or hand this folder to whoever runs your site.
`;

function wxr(pages: SitePage[], p: OwnerProfile, site: string) {
  const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
<title>${cdata(p.name)}</title>
<link>${esc(site)}</link>
<language>en-US</language>
<wp:wxr_version>1.2</wp:wxr_version>
<wp:base_site_url>${esc(site)}</wp:base_site_url>
<wp:base_blog_url>${esc(site)}</wp:base_blog_url>
${pages
  .map(
    (pg, i) => `<item>
<title>${cdata(pg.title)}</title>
<dc:creator>${cdata("admin")}</dc:creator>
<content:encoded>${cdata(pg.html.replace(/<\/?mark>/g, ""))}</content:encoded>
<excerpt:encoded>${cdata("")}</excerpt:encoded>
<wp:post_id>${9000 + i}</wp:post_id>
<wp:post_date>${cdata(now)}</wp:post_date>
<wp:post_name>${cdata(pg.slug)}</wp:post_name>
<wp:status>${cdata("draft")}</wp:status>
<wp:post_parent>0</wp:post_parent>
<wp:menu_order>${i}</wp:menu_order>
<wp:post_type>${cdata("page")}</wp:post_type>
<wp:comment_status>${cdata("closed")}</wp:comment_status>
<wp:ping_status>${cdata("closed")}</wp:ping_status>
</item>`,
  )
  .join("\n")}
</channel>
</rss>
`;
}

/** The whole pack as a .zip (bytes). */
export function websiteZip(kit: LaunchKit, p: OwnerProfile, schema: string, menuWord?: string): Uint8Array {
  const pages = sitePages(kit, p, menuWord);
  const home: SitePage = {
    slug: "index",
    title: p.name,
    html: `${textToHtml(kit.description)}\n<h2>${menuWord === "menu" ? "Menu" : "Services"}</h2>\n<ul>\n${(kit.servicePages?.length ? kit.servicePages.map((s) => `  <li><a href="${cleanSlug(s.slug)}.html">${esc(s.title)}</a></li>`) : kit.services.map((s) => `  <li>${esc(s.name)}</li>`)).join("\n")}\n</ul>${p.phone ? `\n<p>Call or text <a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">${esc(p.phone)}</a> to book.</p>` : ""}`,
  };
  const all = [home, ...pages];
  const files: Record<string, Uint8Array> = { "README.txt": strToU8(README(p)) };
  for (const pg of all) files[`${pg.slug}.html`] = strToU8(htmlFile(pg, p, schema, all.slice(1), kit.shortDescription));
  files["wordpress-import.xml"] = strToU8(wxr(all, p, p.website || "https://example.com"));
  return zipSync(files, { level: 6 });
}
