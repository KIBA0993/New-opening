import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { seal, unseal } from "./auth";
import { env, has } from "./env";
import { stripe } from "./billing";
import { dayKey } from "./stats";

// Owner-only admin page. The password lives in ADMIN_PASSWORD (Vercel env var), never in code.
export const ADMIN_COOKIE = "od_admin";
export const OWNER_PASS_COOKIE = "md_owner";
export const adminEnabled = () => !!process.env.ADMIN_PASSWORD;

const digest = (s: string) => createHash("sha256").update(s).digest();
export function passwordOk(input: string) {
  const want = process.env.ADMIN_PASSWORD || "";
  return !!want && timingSafeEqual(digest(input), digest(want));
}

export async function startAdmin() {
  (await cookies()).set(ADMIN_COOKIE, seal({ k: "admin", exp: Date.now() + 7 * 864e5 }), {
    httpOnly: true,
    secure: env.siteUrl.startsWith("https"),
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 86400,
  });
  // Stop counting this browser in the traffic numbers (kept as long as browsers allow).
  // Lets the owner open free checks without the daily cap, including from email links (lax, so it's sent on clicks from Gmail).
  (await cookies()).set(OWNER_PASS_COOKIE, seal({ k: "owner", exp: Date.now() + 90 * 864e5 }), {
    httpOnly: true,
    secure: env.siteUrl.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 86400,
  });
  (await cookies()).set("md_me", "1", { httpOnly: true, secure: env.siteUrl.startsWith("https"), sameSite: "lax", path: "/", maxAge: 400 * 86400 });
}

export async function isAdmin() {
  if (!adminEnabled()) return false;
  try {
    return unseal<{ k: string }>((await cookies()).get(ADMIN_COOKIE)?.value)?.k === "admin";
  } catch {
    return false;
  }
}

/** True for a browser that has signed in to /admin. Sent on links from email too, unlike the admin cookie. */
export async function isOwnerBrowser() {
  if (!adminEnabled()) return false;
  try {
    const c = await cookies();
    if (unseal<{ k: string }>(c.get(OWNER_PASS_COOKIE)?.value)?.k === "owner") return true;
  } catch {}
  return isAdmin();
}

// ---------- Sales from Stripe ----------

export interface Sales {
  connected: boolean;
  byDay: Record<string, { kits: number; autopilots: number; revenue: number }>;
  all: { kits: number; autopilots: number; topups: number; revenue: number };
  activeSubs: number;
  mrr: number;
  recent: { at: number; what: string; business: string; amount: number; source: string }[];
}

export async function sales(): Promise<Sales> {
  const out: Sales = { connected: has.stripe(), byDay: {}, all: { kits: 0, autopilots: 0, topups: 0, revenue: 0 }, activeSubs: 0, mrr: 0, recent: [] };
  if (!has.stripe()) return out;
  let n = 0;
  for await (const s of stripe().checkout.sessions.list({ status: "complete", limit: 100 })) {
    if (++n > 5000) break;
    if (s.payment_status !== "paid") continue;
    const product = s.metadata?.product || (s.mode === "subscription" ? "monthly" : "kit");
    const amount = (s.amount_total || 0) / 100;
    const d = dayKey(new Date(s.created * 1000));
    const row = (out.byDay[d] ||= { kits: 0, autopilots: 0, revenue: 0 });
    if (product === "kit") { out.all.kits++; row.kits++; }
    else if (product === "credits") out.all.topups++;
    else { out.all.autopilots++; row.autopilots++; }
    out.all.revenue += amount;
    row.revenue += amount;
    if (out.recent.length < 10) {
      out.recent.push({ at: s.created * 1000, what: product === "kit" ? "Launch Kit" : product === "credits" ? "Re-check top-up" : `Autopilot (${product})`, business: s.metadata?.name || "", amount, source: s.metadata?.src === "owner" ? "your own test" : (s.metadata?.src || "").split("|")[0] });
    }
  }
  for await (const sub of stripe().subscriptions.list({ status: "active", limit: 100 })) {
    out.activeSubs++;
    for (const it of sub.items.data) {
      const p = it.price;
      const cents = (p.unit_amount || 0) * (it.quantity || 1);
      out.mrr += p.recurring?.interval === "year" ? cents / 12 / 100 : cents / 100;
    }
  }
  return out;
}
