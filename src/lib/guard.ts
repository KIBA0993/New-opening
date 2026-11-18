import "server-only";
import { cookies, headers } from "next/headers";
import { env } from "./env";
import { seal, unseal } from "./auth";

// Bot and abuse protection: rate limits, daily spending caps, an invisible bot check
// (Cloudflare Turnstile) and a crawler filter. Every piece works without new keys;
// the keys make it stronger (a shared store across servers, and the bot check).

// ---------- Counters: Upstash Redis when set (shared by every server), else in memory ----------

const mem = new Map<string, { n: number; exp: number }>();

async function incr(key: string, ttlSec: number): Promise<number> {
  if (env.upstashUrl && env.upstashToken) {
    try {
      const res = await fetch(`${env.upstashUrl}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.upstashToken}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, String(ttlSec), "NX"],
        ]),
        cache: "no-store",
      });
      const out = (await res.json()) as { result?: number }[];
      if (typeof out?.[0]?.result === "number") return out[0].result;
    } catch (e) {
      console.error("upstash", e);
    }
  }
  const now = Date.now();
  if (mem.size > 50_000) for (const [k, v] of mem) if (v.exp < now) mem.delete(k);
  const row = mem.get(key);
  if (!row || row.exp < now) {
    mem.set(key, { n: 1, exp: now + ttlSec * 1000 });
    return 1;
  }
  row.n++;
  return row.n;
}

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

/** Fixed-window rate limit. True when this call is allowed. */
export async function allow(bucket: string, id: string, limit: number, windowSec: number): Promise<boolean> {
  const win = Math.floor(Date.now() / 1000 / windowSec);
  return (await incr(`rl:${bucket}:${id}:${win}`, windowSec)) <= limit;
}

/** Same, keyed by the visitor's IP address. */
export async function allowIp(bucket: string, limit: number, windowSec: number): Promise<boolean> {
  return allow(bucket, await clientIp(), limit, windowSec);
}

// ---------- Daily spending caps on paid APIs ----------

export class SpendCapError extends Error {
  constructor(kind: string) {
    super(`Daily ${kind} cap reached`);
  }
}

const CAPS = { ai: () => env.aiDailyCap, places: () => env.placesDailyCap, dataforseo: () => env.dataforseoDailyCap };

/** Counts one paid call. Throws SpendCapError once today's cap is used up, so callers fall back. */
export async function spend(kind: keyof typeof CAPS) {
  const day = new Date().toISOString().slice(0, 10);
  const n = await incr(`cap:${kind}:${day}`, 60 * 60 * 26);
  if (n > CAPS[kind]()) {
    if (n === CAPS[kind]() + 1) console.error(`[guard] daily ${kind} cap of ${CAPS[kind]()} reached`);
    throw new SpendCapError(kind);
  }
}

// ---------- Invisible bot check (Cloudflare Turnstile) ----------

export const turnstileOn = () => !!(env.turnstileSiteKey && env.turnstileSecret);

export async function verifyTurnstile(token: string | undefined | null): Promise<boolean> {
  if (!turnstileOn()) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.turnstileSecret, response: token, remoteip: await clientIp() }),
      cache: "no-store",
    });
    const out = (await res.json()) as { success?: boolean };
    return !!out.success;
  } catch (e) {
    console.error("turnstile", e);
    return false;
  }
}

// After one passed check, a signed cookie lets the visitor run checks for a day without another.
const HUMAN_COOKIE = "od_h";

export async function markHuman() {
  if (!turnstileOn()) return; // nothing to remember when the bot check is off
  (await cookies()).set(HUMAN_COOKIE, seal({ k: "human", exp: Date.now() + 864e5 }), {
    httpOnly: true,
    secure: env.siteUrl.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
}

export async function isHuman(): Promise<boolean> {
  if (!turnstileOn()) return true;
  try {
    return unseal<{ k: string }>((await cookies()).get(HUMAN_COOKIE)?.value)?.k === "human";
  } catch {
    return false;
  }
}

// ---------- Crawlers and scripts ----------

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|curl|wget|python|httpx|axios|node-fetch|go-http|java\/|headless|phantom|scrapy/i;

/** Link previews, crawlers and scripts: they get the page, but never trigger paid AI calls. */
export async function looksLikeBot(): Promise<boolean> {
  const ua = (await headers()).get("user-agent") || "";
  return !ua || BOT_UA.test(ua);
}

/** Honeypot: a hidden field people never see. Anything typed in it came from a bot. */
export const HONEYPOT = "company_site";
export const trippedHoneypot = (body: unknown) => !!(body && typeof body === "object" && (body as Record<string, unknown>)[HONEYPOT]);
