import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { has } from "./env";
import { industryBySlug } from "./industries";
import { writeJSON } from "./providers/ai";
import { latestReviews } from "./providers/places";
import type { IndustrySlug } from "./types";

// Prefills the onboarding answers so the owner only has to check and tweak them.

export interface SuggestInput {
  placeId: string;
  name: string;
  address: string;
  city: string;
  industry: IndustrySlug;
  typeLabel?: string;
  types?: string[];
  website?: string;
}

export interface Suggestion {
  services: string[];
  different: string;
  areas: string[];
  ai: boolean;
}

const Schema = z.object({
  services: z.array(z.string()),
  different: z.string(),
  areas: z.array(z.string()),
});

/** Instant, no-AI starting point from the industry. Used while the AI suggestion loads, and when there's no key. */
export function templateSuggestion(i: Pick<SuggestInput, "industry" | "city">): Suggestion {
  const ind = industryBySlug(i.industry)!;
  return {
    services: [...ind.starterServices],
    different: "",
    areas: i.city ? [i.city.split(",")[0].trim()] : [],
    ai: false,
  };
}

async function aiSuggestion(i: SuggestInput): Promise<Suggestion> {
  const ind = industryBySlug(i.industry)!;
  const reviews = i.placeId && i.placeId !== "new" ? await latestReviews(i.placeId).catch(() => []) : [];
  const out = await writeJSON(
    `You help a local business owner fill in a short sign-up form. Guess sensible answers they can edit.
Rules: plain words customers use, no hype. Only what is likely true for this exact business. If unsure, keep it generic for the business type. Never invent prices, awards or years.`,
    `Business: ${i.name}
Google category: ${i.typeLabel || "unknown"} (${(i.types || []).slice(0, 6).join(", ") || "no types"})
Business type: ${ind.name}
Address: ${i.address || i.city}
Website: ${i.website || "none"}
Recent Google reviews:
${reviews.map((r) => `- ${r.rating} stars: ${r.text.slice(0, 300)}`).join("\n") || "none yet"}

Return JSON:
- services: 4 to 6 short ${ind.menuWord === "menu" ? "menu items or dish types" : "services"} this business most likely offers, 1 to 4 words each
- different: one short phrase on why customers pick them, based on the reviews if there are any, else ""
- areas: 3 to 5 neighborhoods or nearby towns around the address where their customers come from`,
    Schema,
  );
  if (!out?.services?.length) return templateSuggestion(i);
  return {
    services: out.services.map((s) => s.trim()).filter(Boolean).slice(0, 6),
    different: out.different.trim().slice(0, 200),
    areas: out.areas.map((s) => s.trim()).filter(Boolean).slice(0, 5),
    ai: true,
  };
}

const cached = unstable_cache(
  async (key: string, i: SuggestInput) => {
    void key;
    return aiSuggestion(i);
  },
  ["suggest-v1"],
  { revalidate: 60 * 60 * 24 * 30 },
);

export async function suggestAnswers(i: SuggestInput): Promise<Suggestion> {
  if (!has.anyAI()) return templateSuggestion(i);
  const key = `${i.placeId === "new" ? `${i.name}|${i.city}` : i.placeId}|${i.industry}`;
  try {
    return await cached(key, i);
  } catch (e) {
    console.error("suggest", e);
    return templateSuggestion(i);
  }
}
