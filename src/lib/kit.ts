import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { industryBySlug } from "./industries";
import { writeJSON } from "./providers/ai";
import type { LaunchKit, OwnerProfile } from "./types";

const SYSTEM = `You write Google Business Profile, Yelp and website content for brand-new local businesses run by owners who are not marketers.
AI assistants recommend the business that proves it offers the exact service asked about, with specific facts (services, areas, prices, licenses), so be concrete.
Rules:
- Plain, warm, specific language. No hype words (no "elevate", "unparalleled", "top-notch", "one-stop shop").
- Follow Google's guidelines: no URLs or phone numbers in the description, no keyword stuffing, no ALL CAPS, never change the business name.
- Description: 600 to 740 characters. Short description: under 250 characters (for Apple Maps, Bing and Yelp).
- Pick categories that exist in Google Business Profile's category list.
- Never invent facts (prices, awards, years in business, certifications) that the owner didn't give. Use placeholders like [your price] when needed.`;

const QA = z.object({ q: z.string(), a: z.string() });
const KitSchema = z.object({
  primaryCategory: z.string(),
  secondaryCategories: z.array(z.string()),
  description: z.string(),
  shortDescription: z.string(),
  services: z.array(z.object({ name: z.string(), description: z.string() })),
  keywords: z.array(z.string()),
  qa: z.array(QA),
  posts: z.array(z.object({ title: z.string(), body: z.string() })),
  reviewRequest: z.object({ sms: z.string(), email: z.string(), inPerson: z.string() }),
  facts: z.array(z.string()),
  priceMenu: z.array(z.object({ item: z.string(), price: z.string() })),
  yelp: z.object({ specialties: z.string(), history: z.string() }),
  servicePages: z.array(z.object({ title: z.string(), slug: z.string(), body: z.string() })),
  areaPage: z.object({ title: z.string(), slug: z.string(), body: z.string() }),
});

export async function writeKitUncached(p: OwnerProfile): Promise<LaunchKit> {
  const industry = industryBySlug(p.industry)!;
  const user = `Business: ${p.name}
Industry: ${industry.name}
City: ${p.city}
${industry.menuWord === "menu" ? "Menu" : "Services"}: ${p.services}
What makes them different: ${p.different}
Areas served: ${p.areas || p.city}

Return JSON with keys:
primaryCategory (string), secondaryCategories (array of up to 4 strings),
description (string), shortDescription (string),
services (array of {name, description}, 4 to 8 items, description under 300 chars),
keywords (array of 10 phrases customers would type, including the city or neighborhoods),
qa (array of 5 {q, a} a customer would ask, answered from the owner's facts),
posts (array of 4 {title, body} Google posts for the first month: grand opening, a service spotlight, a meet-the-owner, and a seasonal one for ${new Date().toLocaleString("en-US", { month: "long" })}; body under 1200 chars),
reviewRequest ({sms, email, inPerson}: a short text, a short email, and one line to say in person, all using [REVIEW LINK]. Each one gently asks the customer to mention which service they got and their neighborhood, because that helps neighbors find the right business. Never offer anything in return and never script the review itself),
facts (array of 6 to 10 short, specific, quotable facts and credentials for a "fact sheet" the owner pastes on every listing and their website: what they do, areas served, hours style, how booking works, what makes them different, plus placeholders like "[License #]", "[Insured with ...]", "[Certified in ...]", "[Year started]" for proof the owner must fill in; never invent numbers),
priceMenu (array of 4 to 8 {item, price} for a simple price list, one per service; price is a placeholder like "From $[price]" unless the owner gave prices),
yelp ({specialties, history}: Yelp's "Specialties" field, under 1000 characters, listing the exact services in plain words, and Yelp's "History" field, under 600 characters, about the owner and why they opened; no review requests),
servicePages (array of one website page per main service, 3 to 5 items, each {title (e.g. "Deep cleaning in Austin"), slug (lowercase-with-dashes), body (180 to 300 words in short paragraphs: what's included, who it's for, how it works, a "From $[price]" line, the areas served, and a closing line on how to book)}),
areaPage ({title, slug, body}: one "Areas we serve" page, 150 to 250 words, naming each area served and the services offered there).`;
  const out = await writeJSON(SYSTEM, user, KitSchema);
  if (out && out.description && Array.isArray(out.posts)) return { ...out, demo: false };
  return mockKit(p);
}

export const writeKit = unstable_cache(async (key: string, p: OwnerProfile) => {
  void key;
  return writeKitUncached(p);
}, ["kit-v2"], { revalidate: 60 * 60 * 24 * 30 });

function list(s: string) {
  return s
    .split(/[,\n;]+/)
    .map((x) => x.replace(/^\s*(and|&)\s+/i, "").trim())
    .filter(Boolean);
}

export function mockKit(p: OwnerProfile): LaunchKit {
  const industry = industryBySlug(p.industry)!;
  const items = list(p.services).slice(0, 6);
  const diff = p.different || "friendly, reliable service";
  const area = p.areas || p.city;
  const town = p.city.split(",")[0];
  return {
    demo: true,
    primaryCategory: {
      "home-services": "House cleaning service",
      beauty: "Nail salon",
      "food-trucks": "Food truck",
      pet: "Pet groomer",
      wellness: "Massage therapist",
      restaurants: "Restaurant",
    }[p.industry],
    secondaryCategories: {
      "home-services": ["Janitorial service", "Window cleaning service", "Carpet cleaning service"],
      beauty: ["Beauty salon", "Nail technician", "Waxing hair removal service"],
      "food-trucks": ["Caterer", "Mexican restaurant", "Takeout restaurant"],
      pet: ["Dog day care center", "Pet supply store", "Pet trainer"],
      wellness: ["Massage spa", "Wellness center", "Sports massage therapist"],
      restaurants: ["Takeout restaurant", "Brunch restaurant", "Caterer"],
    }[p.industry],
    description: `${p.name} is a new ${industry.term} in ${p.city}, serving ${area}. We offer ${items.slice(0, 3).join(", ").toLowerCase() || "a full range of services"}, with a focus on what our neighbors care about most: ${diff.toLowerCase()}. We just opened and we're building this business one happy customer at a time, so you'll always deal directly with the owner. Booking is simple, our prices are clear up front, and if anything isn't right, we'll make it right. Stop by or send us a message to say hello. We'd love to be your go-to ${industry.term} in ${p.city.split(",")[0]}.`,
    shortDescription: `New ${industry.term} in ${p.city.split(",")[0]}. ${items.slice(0, 2).join(" and ") || "Friendly local service"}. ${diff}.`.slice(0, 240),
    services: (items.length ? items : ["Our main service", "Our second service"]).map((name) => ({
      name: name[0].toUpperCase() + name.slice(1),
      description: `${name[0].toUpperCase() + name.slice(1)} from ${p.name}, done with care. ${diff}. Ask us about first-visit pricing.`,
    })),
    keywords: [
      `${industry.term} ${p.city.split(",")[0]}`,
      `${industry.term} near me`,
      `best ${industry.term} in ${p.city.split(",")[0]}`,
      ...items.slice(0, 4).map((i) => `${i.toLowerCase()} ${p.city.split(",")[0]}`),
      ...list(area).slice(0, 3).map((a) => `${industry.term} ${a}`),
    ].slice(0, 10),
    qa: [
      { q: "Are you taking new customers?", a: `Yes! We just opened and we're welcoming new customers in ${area}.` },
      { q: "How do I book?", a: "Call or message us here on Google, and we'll get you scheduled quickly." },
      { q: `What ${industry.menuWord} do you offer?`, a: items.join(", ") || "Ask us and we'll walk you through everything." },
      { q: "What makes you different?", a: diff },
      { q: "What areas do you serve?", a: area },
    ],
    posts: [
      { title: "We're open!", body: `${p.name} is officially open in ${p.city.split(",")[0]}. Come say hi, and ask about our opening week special.` },
      { title: `Spotlight: ${items[0] || "our most popular service"}`, body: `Our most requested: ${items[0] || "our signature service"}. ${diff}. Message us to book.` },
      { title: "Meet the owner", body: `Hi neighbors! I started ${p.name} because I wanted to bring ${diff.toLowerCase()} to ${p.city.split(",")[0]}. I'd love to meet you.` },
      { title: "Holiday hours and bookings", body: `The holidays are busy, so book early. We'll post any holiday hour changes here first.` },
    ],
    reviewRequest: {
      sms: `Hi! Thanks for choosing ${p.name}. If you have 30 seconds, a Google review helps a new local business a lot. Mentioning what we did for you and your neighborhood helps neighbors find us: [REVIEW LINK]`,
      email: `Subject: A quick favor from ${p.name}\n\nThank you for trusting us! We just opened, and reviews help neighbors find us. If you have a minute, would you share how it went? It helps most if you mention which service you had and your neighborhood.\n\n[REVIEW LINK]\n\nThank you,\n${p.name}`,
      inPerson: "We're brand new, so a quick Google review would mean the world. If you mention what we did and where, it helps your neighbors find us. Can I text you the link?",
    },
    facts: [
      `${p.name} is a ${industry.term} in ${town}, serving ${area}.`,
      `Services: ${items.join(", ") || "[your main services]"}.`,
      `What makes us different: ${diff}.`,
      "Owner-operated. You deal directly with the owner.",
      "Licensed: [License #]",
      "Insured with: [insurance company]",
      "Certified in: [certifications or training]",
      "In business since: [year]",
    ],
    priceMenu: (items.length ? items : ["Our main service"]).map((i) => ({ item: i[0].toUpperCase() + i.slice(1), price: "From $[price]" })),
    yelp: {
      specialties: `${items.join(", ") || "Our services"} for ${area}. ${diff}.`,
      history: `${p.name} opened in ${new Date().getFullYear()} in ${town}. [A line about why you started it.]`,
    },
    servicePages: (items.length ? items : ["Our main service"]).slice(0, 4).map((i) => {
      const name = i[0].toUpperCase() + i.slice(1);
      return {
        title: `${name} in ${town}`,
        slug: `${i}-${town}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        body: `${name} from ${p.name}, serving ${area}.\n\nWhat's included: [list what the job covers].\n\nWho it's for: [the customers who usually book this].\n\nHow it works: book by phone or message, we confirm a time, and we take care of the rest. ${diff}.\n\nPrice: from $[price].\n\nReady to book? Call or message us today.`,
      };
    }),
    areaPage: {
      title: `Areas we serve around ${town}`,
      slug: "areas-we-serve",
      body: `${p.name} serves ${area}. In each area we offer ${items.slice(0, 3).join(", ").toLowerCase() || "our full range of services"}. Not sure if we cover your street? Message us and we'll let you know right away.`,
    },
  };
}

/** LocalBusiness schema the owner pastes into their website's <head>. Built from their own answers, no AI. */
export function businessSchema(p: OwnerProfile, kit: LaunchKit, serviceArea: boolean): string {
  const areas = list(p.areas || p.city);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: p.name,
    description: kit.shortDescription,
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.website ? { url: p.website } : {}),
    ...(serviceArea ? {} : { address: { "@type": "PostalAddress", streetAddress: p.address } }),
    areaServed: areas.length > 1 ? areas : areas[0] || p.city,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: kit.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name, description: s.description } })),
    },
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

/** robots.txt lines that let AI search crawlers read the site. */
export const AI_ROBOTS = `User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /`;
