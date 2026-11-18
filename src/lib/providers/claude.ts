import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "../env";

// Claude does three jobs: answers local questions like a consumer assistant (with live web search),
// searches the web for listings, rival news and events, and writes the kit and weekly email.

let _client: Anthropic | null = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: env.anthropic });
  return _client;
}

// On a safety decline, the API re-runs the request on a fallback model it picks.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

function webSearch(city?: string) {
  const [town, region] = (city || "").split(",").map((s) => s.trim());
  return {
    type: "web_search_20260209" as const,
    name: "web_search" as const,
    max_uses: 4,
    user_location: { type: "approximate" as const, country: "US", ...(town ? { city: town } : {}), ...(region && region.length <= 3 ? { region } : {}) },
  };
}

function textOf(content: Anthropic.Beta.BetaContentBlock[]) {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** One web-searching request, resuming if the server-side search loop pauses. */
async function searchTurn(system: string, prompt: string, city?: string): Promise<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  let text = "";
  for (let i = 0; i < 3; i++) {
    const res = await client().beta.messages.create({
      ...FALLBACK,
      model: env.claudeModel,
      max_tokens: 16000,
      output_config: { effort: "low" },
      system,
      tools: [webSearch(city)],
      messages,
    });
    text += textOf(res.content);
    if (res.stop_reason !== "pause_turn") break;
    messages.splice(1, messages.length - 1, { role: "assistant", content: res.content });
  }
  return text;
}

/** Ask Claude a local question the way a customer would. */
export function askClaude(prompt: string, city?: string) {
  return searchTurn(
    "You are a helpful assistant answering a local search question. Search the web, then recommend specific businesses by name, like you normally would for a consumer.",
    prompt,
    city,
  );
}

/** Search the web and reply with JSON (parsed from the text; citations make strict output formats unavailable here). */
export async function claudeSearchJSON<T>(prompt: string, city?: string): Promise<T | null> {
  const text = await searchTurn(
    "Search the web and answer with a single JSON object only, no prose, no code fences. If you are not sure, say so in the JSON rather than guessing.",
    prompt,
    city,
  );
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

/** Write structured content, validated against a Zod schema. */
export async function claudeWrite<S extends z.ZodType>(system: string, user: string, schema: S): Promise<z.infer<S> | null> {
  const res = await client().beta.messages.parse({
    ...FALLBACK,
    model: env.claudeModel,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: betaZodOutputFormat(schema) },
  });
  if (res.stop_reason === "refusal") return null;
  return (res.parsed_output as z.infer<S> | null) ?? null;
}
