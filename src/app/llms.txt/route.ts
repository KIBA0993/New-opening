import { GUIDES_CONTENT } from "@/lib/guides";
import { INDUSTRIES } from "@/lib/industries";
import { PRICES } from "@/lib/env";
import { LAUNCH } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import { COMPARISONS } from "@/lib/compare";

// llms.txt: a plain summary for AI assistants (https://llmstxt.org).
export const dynamic = "force-static";
export const revalidate = 3600; // prices change when the launch deal ends

export function GET() {
  const body = `# MapDebut

> MapDebut helps newly opened local businesses get found on Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT. It offers a free AI visibility check, a one-time Launch Kit (launch price from $${LAUNCH.start}) that writes every profile and guides the owner through setup and Google verification, and a Weekly Autopilot email (${PRICES.monthly.label}/month or ${PRICES.yearly.label}/year).

MapDebut is self-serve software. Owners stay in control of their own profiles; it never signs in to their accounts.

## Free tools
- [AI visibility checker](${SITE_URL}/tools/chatgpt-visibility-checker): checks whether AI assistants recommend a local business and which nearby rivals they name instead.
- [Google review link and QR code generator](${SITE_URL}/tools/google-review-link): free direct review link and printable QR code.
- [Business name checker](${SITE_URL}/tools/business-name-checker): checks a Google Business Profile name against Google's name rules (keywords, locations, phone numbers, taglines) before it gets a new profile suspended.

## Pricing and comparisons
- [Pricing](${SITE_URL}/pricing): free check, one-time Launch Kit, optional Weekly Autopilot, 14-day money-back promise.
${COMPARISONS.map((c) => `- [${c.title}](${SITE_URL}/compare/${c.slug}): ${c.description}`).join("\n")}
- [About MapDebut](${SITE_URL}/about): who builds it and how it works.

## Research
- [Do AI assistants recommend new businesses?](${SITE_URL}/research/new-business-ai-visibility): Nov 2026 study of 100 Chicago businesses licensed 1 to 4 months earlier. An AI assistant with live web search named 5 of 100 when asked for the best in their neighborhood; 72 of 100 were on Google Maps; 26 of the 72 on Maps had under 10 reviews.

## Who it's for
${INDUSTRIES.map((i) => `- [${i.name}](${SITE_URL}/for/${i.slug}): ${i.who}`).join("\n")}

## Guides
${GUIDES_CONTENT.map((g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`).join("\n")}

## Short answers to what new owners ask
${GUIDES_CONTENT.filter((g) => g.topic && g.topic !== "customers").map((g) => `- ${g.title}: ${g.answer} ([guide](${SITE_URL}/guides/${g.slug}))`).join("\n")}

More: [Questions new business owners ask](${SITE_URL}/questions). Full text of every guide: [llms-full.txt](${SITE_URL}/llms-full.txt).

## Product
- [Weekly Autopilot](${SITE_URL}/autopilot): weekly AI recommendation check, rival moves, a ready-to-paste Google post, review replies, a seasonal campaign idea, and local events to join with a drafted pitch.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
