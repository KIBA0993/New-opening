import "server-only";
import { unstable_cache } from "next/cache";
import { spend } from "../guard";
import type { z } from "zod";
import { env, has } from "../env";
import type { Engine } from "../types";
import { askClaude, claudeSearchJSON, claudeWrite } from "./claude";

// Thin wrappers around the AI engines we check (any with a key), plus a JSON writer.

export const ENGINE_LABEL: Record<Engine, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
};

export const ALL_ENGINES: Engine[] = ["chatgpt", "claude", "perplexity", "gemini"];

export function engineAvailable(e: Engine) {
  return e === "chatgpt" ? has.openai() : e === "claude" ? has.anthropic() : e === "perplexity" ? has.perplexity() : has.gemini();
}

/** Engines with a key. In demo mode (no AI keys at all) we show sample answers for ChatGPT, Perplexity and Gemini. */
export function liveEngines(): Engine[] {
  return ALL_ENGINES.filter(engineAvailable);
}

export function checkEngines(): { engines: Engine[]; demo: boolean } {
  const live = liveEngines();
  return live.length ? { engines: live, demo: false } : { engines: ["chatgpt", "perplexity", "gemini"], demo: true };
}

/** "Claude", "ChatGPT and Claude", "ChatGPT, Claude and Gemini" - for honest copy. */
export function engineNames(): string {
  const names = checkEngines().engines.map((e) => ENGINE_LABEL[e]);
  return names.length <= 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

const ASK_SYSTEM =
  "You are a helpful assistant answering a local search question. Recommend specific businesses by name, like you normally would for a consumer.";

async function askOpenAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.openai}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.openaiModel,
      tools: [{ type: "web_search" }],
      instructions: ASK_SYSTEM,
      input: prompt,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] };
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text || "")
    .join("\n");
}

async function askPerplexity(prompt: string, system = ASK_SYSTEM): Promise<string> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.perplexity}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.perplexityModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices?.[0]?.message?.content || "";
}

async function askGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.gemini },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: ASK_SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
}

export async function askEngine(engine: Engine, prompt: string, city?: string): Promise<string> {
  await spend("ai");
  if (engine === "chatgpt") return askOpenAI(prompt);
  if (engine === "claude") return askClaude(prompt, city);
  if (engine === "perplexity") return askPerplexity(prompt);
  return askGemini(prompt);
}

/**
 * Answers are cached by question, not by business: "best nail salon in Austin" is the same
 * answer for every nail salon in Austin, so after the first check in a city the rest are instant and free.
 */
export const cachedAsk = unstable_cache(
  async (engine: Engine, prompt: string, city?: string) => askEngine(engine, prompt, city),
  ["ask-v1"],
  { revalidate: 60 * 60 * 24 },
);

/** The free check keeps answers 3 days (they change slowly). The weekly digest uses the 1-day cache above. */
export const cachedAskFree = unstable_cache(
  async (engine: Engine, prompt: string, city?: string) => askEngine(engine, prompt, city),
  ["ask-free-v1"],
  { revalidate: 60 * 60 * 24 * 3 },
);

/** Write structured content (profiles, emails). Claude first, then OpenAI. Returns null when no writer is configured. */
export async function writeJSON<S extends z.ZodType>(system: string, user: string, schema: S): Promise<z.infer<S> | null> {
  try {
    await spend("ai");
  } catch {
    return null;
  }
  if (has.anthropic()) {
    try {
      return await claudeWrite(system, user, schema);
    } catch (e) {
      console.error("claudeWrite failed", e);
      return null;
    }
  }
  if (!has.openai()) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.openai}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.openaiWriterModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system + "\nReply with a single JSON object only." },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    console.error("writeJSON failed", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  try {
    const parsed = schema.safeParse(JSON.parse(data.choices[0].message.content));
    return parsed.success ? (parsed.data as z.infer<S>) : null;
  } catch {
    return null;
  }
}

/** Ask a web-searching model for JSON (Claude first, then Perplexity, then ChatGPT with search). */
export async function searchJSON<T>(prompt: string, city?: string): Promise<T | null> {
  try {
    await spend("ai");
  } catch {
    return null;
  }
  if (has.anthropic()) {
    try {
      return await claudeSearchJSON<T>(prompt, city);
    } catch (e) {
      console.error("claudeSearchJSON failed", e);
      return null;
    }
  }
  const instr =
    "Search the web and answer with a single JSON object only, no prose, no code fences. If you are not sure, say so in the JSON rather than guessing.";
  let text = "";
  try {
    if (has.perplexity()) text = await askPerplexity(prompt, instr);
    else if (has.openai()) text = await askOpenAI(`${instr}\n\n${prompt}`);
    else return null;
  } catch (e) {
    console.error("searchJSON failed", e);
    return null;
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

// ---------- matching business names inside AI answers ----------

const STOP = new Set(["the", "and", "llc", "inc", "co", "company", "ltd", "corp", "of", "&", "a"]);

export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .join(" ");
}

/** Same business or another location of the same brand ("4ever Young" vs "4ever Young Johns Creek"). */
export function sameBrand(a: string, b: string) {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return false;
  return x === y || mentions(a, b) || mentions(b, a);
}

export function mentions(answer: string, name: string) {
  const a = ` ${normalizeName(answer)} `;
  const n = normalizeName(name);
  if (!n) return false;
  if (a.includes(` ${n} `)) return true;
  // Allow a match on the first two distinctive words ("Polished Nail" for "Polished Nail Lounge").
  const words = n.split(" ");
  if (words.length >= 3) return a.includes(` ${words.slice(0, 2).join(" ")} `);
  return false;
}

export function excerptAround(answer: string, name: string, len = 220) {
  const clean = answer.replace(/\s+/g, " ").replace(/\[\d+\]/g, "").trim();
  const idx = clean.toLowerCase().indexOf(name.toLowerCase().split(" ")[0]);
  if (idx < 0) return clean.slice(0, len) + (clean.length > len ? "…" : "");
  const start = Math.max(0, idx - 60);
  return (start > 0 ? "…" : "") + clean.slice(start, start + len) + (clean.length > start + len ? "…" : "");
}
