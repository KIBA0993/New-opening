import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { industryBySlug } from "./industries";
import { writeJSON } from "./providers/ai";
import type { LaunchKit, OwnerProfile } from "./types";

const SYSTEM = `You write Google Business Profile content for brand-new local businesses run by owners who are not marketers.
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
reviewRequest ({sms, email, inPerson}: a short text, a short email, and one line to say in person, all using [REVIEW LINK]).`;
  const out = await writeJSON(SYSTEM, user, KitSchema);
  if (out && out.description && Array.isArray(out.posts)) return { ...out, demo: false };
  return mockKit(p);
}

export const writeKit = unstable_cache(async (key: string, p: OwnerProfile) => {
  void key;
  return writeKitUncached(p);
}, ["kit-v1"], { revalidate: 60 * 60 * 24 * 30 });

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
      sms: `Hi! Thanks for choosing ${p.name}. If you have 30 seconds, a Google review helps a new local business a lot: [REVIEW LINK]`,
      email: `Subject: A quick favor from ${p.name}\n\nThank you for trusting us! We just opened, and reviews help neighbors find us. If you have a minute, would you share how it went?\n\n[REVIEW LINK]\n\nThank you,\n${p.name}`,
      inPerson: "We're brand new, so a quick Google review would mean the world. Can I text you the link?",
    },
  };
}
