import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env, has } from "./env";

// Passwordless sign-in: an emailed one-time link, or Google. No database: the session is a
// signed cookie holding the email, and purchases are looked up in Stripe by that email.
// Private links from checkout and emails keep working without signing in.

export const SESSION_COOKIE = "od_session";
const SESSION_DAYS = 30;
const LINK_MINUTES = 15;

function secret() {
  if (env.authSecret) return env.authSecret;
  // Without a secret, sign-in only works in sample mode (no real customer data to protect).
  if (has.stripe()) throw new Error("AUTH_SECRET is not set");
  return "opening-day-sample-mode-only";
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function seal(payload: Record<string, unknown>) {
  const data = b64(JSON.stringify(payload));
  return `${data}.${sign(data)}`;
}

function open<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [data, mac] = token.split(".");
  if (!data || !mac) return null;
  try {
    const want = Buffer.from(sign(data));
    const got = Buffer.from(mac);
    if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
    const body = JSON.parse(Buffer.from(data, "base64url").toString()) as T & { exp: number };
    return body.exp > Date.now() ? body : null;
  } catch {
    return null;
  }
}

export const normEmail = (e: string) => e.trim().toLowerCase();

/** One-time sign-in link, valid 15 minutes. */
export function magicLink(email: string, next = "/me") {
  const t = seal({ k: "link", email: normEmail(email), next, n: b64(randomBytes(6)), exp: Date.now() + LINK_MINUTES * 60_000 });
  return `${env.siteUrl}/api/auth/verify?t=${encodeURIComponent(t)}`;
}

export function readMagicLink(t: string | undefined) {
  const body = open<{ k: string; email: string; next: string }>(t);
  return body?.k === "link" ? body : null;
}

/** Sets the signed-in cookie. Call from a route handler. */
export async function startSession(email: string) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  (await cookies()).set(SESSION_COOKIE, seal({ k: "session", email: normEmail(email), exp }), {
    httpOnly: true,
    secure: env.siteUrl.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in owner's email, or null. */
export async function currentEmail(): Promise<string | null> {
  try {
    const body = open<{ k: string; email: string }>((await cookies()).get(SESSION_COOKIE)?.value);
    return body?.k === "session" ? body.email : null;
  } catch {
    return null;
  }
}

/** Only allow redirects back into this site after sign-in. */
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/me";
}

// ---------- Google (OpenID Connect, authorization code flow) ----------

export const googleEnabled = () => !!(env.googleClientId && env.googleClientSecret);
const GOOGLE_REDIRECT = () => `${env.siteUrl}/api/auth/google/callback`;
export const STATE_COOKIE = "od_oauth";

export async function googleStart(next: string) {
  const state = b64(randomBytes(16));
  (await cookies()).set(STATE_COOKIE, seal({ state, next: safeNext(next), exp: Date.now() + 10 * 60_000 }), {
    httpOnly: true,
    secure: env.siteUrl.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.googleClientId);
  u.searchParams.set("redirect_uri", GOOGLE_REDIRECT());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

/** Exchanges the code and returns the verified email, or null. */
export async function googleFinish(code: string, state: string): Promise<{ email: string; next: string } | null> {
  const jar = await cookies();
  const saved = open<{ state: string; next: string }>(jar.get(STATE_COOKIE)?.value);
  jar.delete(STATE_COOKIE);
  if (!saved || saved.state !== state) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: GOOGLE_REDIRECT(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    console.error("google token", res.status, await res.text());
    return null;
  }
  const { id_token } = (await res.json()) as { id_token?: string };
  // The ID token came straight from Google's token endpoint over TLS, so its claims can be read directly.
  const claims = id_token ? (JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString()) as { aud?: string; iss?: string; email?: string; email_verified?: boolean; exp?: number }) : null;
  if (!claims?.email || !claims.email_verified || claims.aud !== env.googleClientId) return null;
  if (!["https://accounts.google.com", "accounts.google.com"].includes(claims.iss || "")) return null;
  return { email: normEmail(claims.email), next: saved.next };
}
