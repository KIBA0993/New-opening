import "server-only";
import { cookies } from "next/headers";
import { env, has } from "./env";
import { paidSession, stripe } from "./billing";
import type { OwnerProfile } from "./types";

// Re-check credits for Autopilot subscribers. Placeholder numbers until we measure live AI cost.
export const CREDITS = {
  monthly: Number(process.env.AUTOPILOT_CHECKS_PER_MONTH || 20),
  trial: Number(process.env.AUTOPILOT_CHECKS_IN_TRIAL || 5),
  topupCount: Number(process.env.TOPUP_CHECKS || 20),
  topupPrice: Number(process.env.TOPUP_PRICE || 5),
};

// Stored on the Stripe subscription's metadata (no database):
//   cu = "YYYY-MM:<used this month>", cx = "<extra top-up credits left>"
const month = () => new Date().toISOString().slice(0, 7);

export interface Account {
  profile: OwnerProfile;
  subId: string | null; // null in demo mode
  used: number;
  extra: number;
  allowance: number;
  left: number;
  demo: boolean;
}

interface Stored {
  cu?: string;
  cx?: string;
}

function parse(m: Stored) {
  const [mo, n] = (m.cu || "").split(":");
  const used = mo === month() ? Number(n) || 0 : 0;
  const extra = Math.max(0, Number(m.cx) || 0);
  return { used, extra };
}

const DEMO_COOKIE = "od_credits";

async function readDemo(): Promise<Stored> {
  try {
    return JSON.parse((await cookies()).get(DEMO_COOKIE)?.value || "{}");
  } catch {
    return {};
  }
}

async function subIdFor(sessionId: string) {
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  return typeof s.subscription === "string" ? s.subscription : s.subscription?.id || null;
}

/** The subscriber's credit balance. Returns null when the session isn't an active Autopilot. */
export async function getAccount(sessionId: string): Promise<Account | null> {
  const paid = await paidSession(sessionId);
  if (!paid) return null;
  let stored: Stored;
  let subId: string | null = null;
  let allowance = CREDITS.monthly;
  const demo = sessionId.startsWith("demo_") || !has.stripe();
  if (demo && paid.product === "kit") return null;
  if (demo) stored = await readDemo();
  else {
    subId = await subIdFor(sessionId);
    if (!subId) return null;
    const sub = await stripe().subscriptions.retrieve(subId);
    if (!["active", "trialing", "past_due"].includes(sub.status)) return null;
    // A Kit buyer's free week gets a few re-checks; the full monthly allowance starts once it's paid.
    if (sub.status === "trialing") allowance = Math.min(CREDITS.trial, CREDITS.monthly);
    stored = sub.metadata as Stored;
  }
  const { used, extra } = parse(stored);
  return { profile: paid.profile, subId, used, extra, allowance, left: Math.max(0, allowance - used) + extra, demo };
}

async function save(a: Account, used: number, extra: number) {
  const meta = { cu: `${month()}:${used}`, cx: String(extra) };
  if (a.demo) {
    (await cookies()).set(DEMO_COOKIE, JSON.stringify(meta), { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 60, path: "/" });
  } else if (a.subId) {
    await stripe().subscriptions.update(a.subId, { metadata: meta });
  }
}

/** Takes one credit (call after a check succeeds): this month's allowance first, then top-ups. */
export async function spendCredit(a: Account): Promise<boolean> {
  if (a.left <= 0) return false;
  if (a.used < a.allowance) await save(a, a.used + 1, a.extra);
  else await save(a, a.used, a.extra - 1);
  return true;
}

/** Stripe checkout for a top-up pack. In demo mode it adds the credits straight away. */
export async function createTopup(sessionId: string, a: Account): Promise<string> {
  const back = `${env.siteUrl}/autopilot/account?session_id=${encodeURIComponent(sessionId)}`;
  if (a.demo) {
    await save(a, a.used, a.extra + CREDITS.topupCount);
    return back + "&added=1";
  }
  const s = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: CREDITS.topupPrice * 100,
          product_data: { name: `${CREDITS.topupCount} extra AI re-checks` },
        },
      },
    ],
    customer_email: a.profile.email || undefined,
    metadata: { product: "credits", sub: a.subId!, n: String(CREDITS.topupCount) },
    success_url: `${back}&topup={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
  });
  return s.url!;
}

/** Adds a paid top-up to the balance once. Safe to call on every page load. */
export async function applyTopup(topupId: string, a: Account): Promise<boolean> {
  if (a.demo || !a.subId) return false;
  try {
    const t = await stripe().checkout.sessions.retrieve(topupId);
    if (t.payment_status !== "paid" || t.metadata?.product !== "credits" || t.metadata.sub !== a.subId || t.metadata.applied === "1") return false;
    // Mark it applied first so a double load can't add it twice.
    await stripe().checkout.sessions.update(topupId, { metadata: { ...t.metadata, applied: "1" } });
    const n = Number(t.metadata.n) || CREDITS.topupCount;
    await save(a, a.used, a.extra + n);
    a.extra += n;
    a.left += n;
    return true;
  } catch (e) {
    console.error("topup", e);
    return false;
  }
}
