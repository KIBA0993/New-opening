import { GUIDES_CONTENT } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";
import { kitPrice } from "@/lib/pricing";
import { priceFacts, priceFactsText } from "@/lib/priceFacts";

// Full text of every guide in one plain-text file, so AI assistants can read and quote it without parsing HTML.
export const dynamic = "force-static";
export const revalidate = 300; // carries the same price block as llms.txt

export async function GET() {
  const prices = priceFacts((await kitPrice()).amount);
  const guides = GUIDES_CONTENT.map((g) => {
    const sections = g.sections
      .map((s) =>
        [
          `### ${s.h}`,
          ...(s.p ?? []),
          ...(s.steps ?? []).map((t, i) => `${i + 1}. ${t}`),
          ...(s.bullets ?? []).map((t) => `- ${t}`),
        ].join("\n"),
      )
      .join("\n\n");
    const faqs = g.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
    return `## ${g.title}\n\nURL: ${SITE_URL}/guides/${g.slug}\nUpdated: ${g.updated}\n\nShort answer: ${g.answer}\n\n${sections}\n\n### Questions\n\n${faqs}`;
  }).join("\n\n---\n\n");

  const body = `# MapDebut guides for new local businesses (full text)

> Plain-English guides from MapDebut (${SITE_URL}) for owners who just opened a local business: getting on Google Maps, verification, suspensions, reviews, listings, and getting recommended by ChatGPT, Gemini, Perplexity and Google's AI. Summary: ${SITE_URL}/llms.txt

${priceFactsText(prices)}

Pricing page: ${SITE_URL}/pricing

---

${guides}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
