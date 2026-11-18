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
  claude: "AI assistant", // customers never see the provider's name (KIBA, Nov 18)
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

/** "AI assistants", "ChatGPT and other AI assistants", "ChatGPT, Gemini and other AI assistants" - for honest copy. */
export function engineNames(): string {
  const engines = checkEngines().engines;
  const names = engines.filter((e) => e !== "claude").map((e) => ENGINE_LABEL[e]);
  if (engines.includes("claude")) names.push(names.length ? "other AI assistants" : "AI assistants");
  return names.length <= 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

const ASK_SYSTEM =
  "You are a helpful assistant answering a local search question. Recommend specific businesses by name, like you normally would for a consumer.";

async function askOpenAI(prompt: string): Promise<Answer> {
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
  const data = (await res.json()) as { output_text?: string; output?: { type: string; content?: { type: string; text?: string; annotations?: { url?: string }[] }[] }[] };
  const parts = (data.output || []).flatMap((o) => o.content || []).filter((c) => c.type === "output_text");
  const text = data.output_text || parts.map((c) => c.text || "").join("\n");
  return { text, sources: parts.flatMap((c) => (c.annotations || []).map((a) => a.url || "")) };
}

async function askPerplexity(prompt: string, system = ASK_SYSTEM): Promise<string> {
  return (await askPerplexityFull(prompt, system)).text;
}

async function askPerplexityFull(prompt: string, system = ASK_SYSTEM): Promise<Answer> {
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
  const data = (await res.json()) as { choices: { message: { content: string } }[]; citations?: string[]; search_results?: { url?: string }[] };
  return { text: data.choices?.[0]?.message?.content || "", sources: data.citations || (data.search_results || []).map((r) => r.url || "") };
}

async function askGemini(prompt: string): Promise<Answer> {
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
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[] };
  const c = data.candidates?.[0];
  // Gemini's links are Google redirects; the chunk title is the site's domain.
  const sources = (c?.groundingMetadata?.groundingChunks || []).map((g) => (g.web?.title ? `https://${g.web.title}` : g.web?.uri || ""));
  return { text: (c?.content?.parts || []).map((p) => p.text || "").join(""), sources };
}

export interface Answer {
  text: string;
  sources: string[]; // sites the engine read or cited, as bare domains
}

/** Bare domains, deduplicated, in the order the engine used them. */
export function domainsOf(urls: string[]): string[] {
  const out: string[] = [];
  for (const u of urls) {
    try {
      const d = new URL(u).hostname.replace(/^(www|m)\./, "");
      if (d && !d.endsWith("vertexaisearch.cloud.google.com") && !out.includes(d)) out.push(d);
    } catch {
      /* skip */
    }
  }
  return out.slice(0, 8);
}

/** Ask an engine like a customer would: the answer text plus the sites it read. */
export async function askEngineFull(engine: Engine, prompt: string, city?: string): Promise<Answer> {
  await spend("ai");
  const a = engine === "chatgpt" ? await askOpenAI(prompt) : engine === "claude" ? await askClaude(prompt, city) : engine === "perplexity" ? await askPerplexityFull(prompt) : await askGemini(prompt);
  return { text: a.text, sources: domainsOf(a.sources) };
}

export async function askEngine(engine: Engine, prompt: string, city?: string): Promise<string> {
  return (await askEngineFull(engine, prompt, city)).text;
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
  async (engine: Engine, prompt: string, city?: string) => askEngineFull(engine, prompt, city),
  ["ask-free-v2"],
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
    else if (has.openai()) text = (await askOpenAI(`${instr}\n\n${prompt}`)).text;
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

/** The brand part of a listing name: "Nora Beauty Lounge - Lashes & Brows | Johns Creek, GA" -> "Nora Beauty Lounge". */
export function coreName(name: string) {
  const core = name.split(/\s[-–—|]\s|\s\(|,\s/)[0].trim();
  return core.length >= 3 ? core : name;
}

export function mentions(answer: string, name: string) {
  const a = ` ${normalizeName(answer)} `;
  for (const candidate of new Set([name, coreName(name)])) {
    const n = normalizeName(candidate);
    if (!n) continue;
    if (a.includes(` ${n} `)) return true;
    // Allow a match on the first distinctive words ("Polished Nail" for "Polished Nail Lounge",
    // "Bluefern Spa" for "Bluefern Spa & Salon"), as long as they're specific enough (8+ letters).
    const words = n.split(" ");
    for (let k = 2; k < words.length; k++) {
      const prefix = words.slice(0, k).join(" ");
      if (prefix.replace(/ /g, "").length >= 8) {
        if (a.includes(` ${prefix} `)) return true;
        break;
      }
    }
  }
  return false;
}

// Bold text and list items that are headings, not business names ("Top picks", "Budget option", "Why we like it").
const HEADING_WORDS = new Set("top best pick picks budget option options tip tips note notes why pros cons price prices pricing hours address phone location locations rating ratings review reviews summary bottom line my our overall honorable mention mentions runner up also consider luxury value quick take recommendation recommendations choice choices worth highly recommended more other great good friendly affordable splurge favorite favorites services specialties highlights booking book walk ins in same day what to know".split(" "));
const isHeading = (s: string) => /^(if|for|what|how|why|where|when|here|look|check|call|try)\b/i.test(s) || /\?$/.test(s) || normalizeName(s).split(" ").every((w) => HEADING_WORDS.has(w));

/**
 * The businesses an answer recommends, read from its formatting: AI answers put each pick in bold
 * ("**Bluefern Spa & Salon**") or at the start of a list item ("1. Bluefern Spa & Salon - ...").
 * Best effort, no AI call: it's what we show as "picked instead".
 */
export function picksIn(answer: string, exclude: string[] = [], limit = 5): string[] {
  const raw: string[] = [];
  for (const m of answer.matchAll(/\*\*([^*\n]{3,80})\*\*/g)) raw.push(m[1]);
  if (!raw.length) for (const m of answer.matchAll(/^\s*(?:\d+[.)]|[-•*])\s+([^\n:–—]{3,60}?)(?:\s[-–—]\s|:|\n|$)/gm)) raw.push(m[1]);
  const out: string[] = [];
  for (let r of raw) {
    r = r.replace(/^[^:]{0,25}:\s*(?=\S)/, "").replace(/[.:,;!]+$/, "").replace(/\s+/g, " ").trim(); // "Top pick: X." -> "X"
    if (r.length < 3 || r.length > 60 || !/[A-Z0-9]/.test(r[0]) || isHeading(r) || /\d{3}/.test(r)) continue;
    const words = r.split(" ");
    if (words.length > 8) continue;
    // Business names are in title case and don't end mid-phrase ("Be more cautious with" isn't one).
    if (/^(and|or|with|of|for|the|at|in|to|a|an|by|on|is|are)$/i.test(words.at(-1)!)) continue;
    if (words.filter((w) => /^[A-Z0-9&]/.test(w)).length * 2 < words.length + 1) continue;
    if (exclude.some((e) => sameBrand(e, r))) continue;
    if (out.some((o) => sameBrand(o, r))) continue;
    out.push(r);
  }
  return out.slice(0, limit);
}

export function excerptAround(answer: string, name: string, len = 220) {
  const clean = answer.replace(/\s+/g, " ").replace(/\[\d+\]/g, "").trim();
  const idx = clean.toLowerCase().indexOf(name.toLowerCase().split(" ")[0]);
  if (idx < 0) return clean.slice(0, len) + (clean.length > len ? "…" : "");
  const start = Math.max(0, idx - 60);
  return (start > 0 ? "…" : "") + clean.slice(start, start + len) + (clean.length > start + len ? "…" : "");
}
