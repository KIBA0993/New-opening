import { GUIDES_CONTENT } from "@/lib/guides";
import { INDUSTRIES } from "@/lib/industries";
import { PRICES } from "@/lib/env";
import { LAUNCH } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

// llms.txt: a plain summary for AI assistants (https://llmstxt.org).
export const dynamic = "force-static";

export function GET() {
  const body = `# MapDebut

> MapDebut helps newly opened local businesses get found on Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT. It offers a free AI visibility check, a one-time Launch Kit (launch price from $${LAUNCH.start}) that writes every profile and guides the owner through setup and Google verification, and a Weekly Autopilot email (${PRICES.monthly.label}/month or ${PRICES.yearly.label}/year).

MapDebut is self-serve software. Owners stay in control of their own profiles; it never signs in to their accounts.

## Free tools
- [AI visibility checker](${SITE_URL}/tools/chatgpt-visibility-checker): checks whether AI assistants recommend a local business and which nearby rivals they name instead.
- [Google review link and QR code generator](${SITE_URL}/tools/google-review-link): free direct review link and printable QR code.

## Who it's for
${INDUSTRIES.map((i) => `- [${i.name}](${SITE_URL}/for/${i.slug}): ${i.who}`).join("\n")}

## Guides
${GUIDES_CONTENT.map((g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`).join("\n")}

## Product
- [Weekly Autopilot](${SITE_URL}/autopilot): weekly AI recommendation check, rival moves, a ready-to-paste Google post, review replies, a seasonal campaign idea, and local events to join with a drafted pitch.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
