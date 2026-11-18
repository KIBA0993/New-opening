import "server-only";
import Stripe from "stripe";
import { env, has, PRICES } from "./env";
import { kitPrice } from "./pricing";
import type { IndustrySlug, OwnerProfile } from "./types";

export type Product = "kit" | "monthly" | "yearly";

let _stripe: Stripe | null = null;
export function stripe() {
  if (!_stripe) _stripe = new Stripe(env.stripe);
  return _stripe;
}

const KEYS: (keyof OwnerProfile)[] = ["placeId", "name", "address", "city", "phone", "website", "industry", "managesProfile", "services", "different", "areas", "email"];

export function profileToMetadata(p: OwnerProfile): Record<string, string> {
  return Object.fromEntries(KEYS.map((k) => [k, String(p[k] ?? "").slice(0, 490)]));
}

export function metadataToProfile(m: Record<string, string> | null | undefined): OwnerProfile | null {
  if (!m?.placeId || !m.name || !m.industry) return null;
  return {
    placeId: m.placeId,
    name: m.name,
    address: m.address || "",
    city: m.city || "",
    phone: m.phone || undefined,
    website: m.website || undefined,
    industry: m.industry as IndustrySlug,
    managesProfile: (m.managesProfile as OwnerProfile["managesProfile"]) || "unsure",
    services: m.services || "",
    different: m.different || "",
    areas: m.areas || "",
    email: m.email || "",
  };
}

// Demo mode (no Stripe key): the "session id" carries the profile itself, so the whole flow works end to end.
const DEMO_PREFIX = "demo_";
export function demoSessionId(p: OwnerProfile, product: Product) {
  return DEMO_PREFIX + Buffer.from(JSON.stringify({ product, m: profileToMetadata(p) })).toString("base64url");
}

export async function createCheckout(product: Product, profile: OwnerProfile): Promise<string> {
  const back = `${env.siteUrl}/report/${encodeURIComponent(profile.placeId)}?industry=${profile.industry}`;
  if (!has.stripe()) {
    const sid = demoSessionId(profile, product);
    return product === "kit" ? `${env.siteUrl}/kit?session_id=${sid}` : `${env.siteUrl}/autopilot/welcome?session_id=${sid}`;
  }
  // The kit has a rising launch price, so it's always charged at today's amount (not a fixed price ID).
  const kitAmount = product === "kit" ? (await kitPrice(true)).amount : 0;
  const metadata = { ...profileToMetadata(profile), product, ...(product === "kit" ? { price: String(kitAmount) } : {}) };
  const priceId = product === "kit" ? "" : product === "monthly" ? env.stripePriceMonthly : env.stripePriceYearly;
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: (product === "kit" ? kitAmount : PRICES[product].amount) * 100,
          product_data: { name: product === "kit" ? "Opening Day Launch Kit" : "Opening Day Weekly Autopilot" },
          ...(product === "kit" ? {} : { recurring: { interval: product === "monthly" ? "month" : "year" } }),
        },
      };
  const session = await stripe().checkout.sessions.create({
    mode: product === "kit" ? "payment" : "subscription",
    line_items: [lineItem],
    customer_email: profile.email || undefined,
    allow_promotion_codes: true,
    metadata,
    ...(product === "kit" ? { payment_intent_data: { metadata } } : { subscription_data: { metadata } }),
    success_url:
      product === "kit"
        ? `${env.siteUrl}/kit?session_id={CHECKOUT_SESSION_ID}`
        : `${env.siteUrl}/autopilot/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
  });
  return session.url!;
}

/** Returns the owner's profile if this checkout session was paid. */
export async function paidSession(sessionId: string): Promise<{ profile: OwnerProfile; product: Product } | null> {
  if (sessionId.startsWith(DEMO_PREFIX)) {
    if (has.stripe()) return null; // demo links don't work once real payments are on
    try {
      const { product, m } = JSON.parse(Buffer.from(sessionId.slice(DEMO_PREFIX.length), "base64url").toString());
      const profile = metadataToProfile(m);
      return profile ? { profile, product } : null;
    } catch {
      return null;
    }
  }
  if (!has.stripe()) return null;
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId);
    if (s.payment_status !== "paid" && s.status !== "complete") return null;
    const profile = metadataToProfile(s.metadata as Record<string, string>);
    return profile ? { profile, product: (s.metadata?.product as Product) || "kit" } : null;
  } catch {
    return null;
  }
}

export interface Purchase {
  sessionId: string;
  product: Product | "credits";
  business: string;
  placeId: string;
  industry: string;
  created: number;
  active?: boolean; // Autopilot only
}

/** Everything bought with this email, newest first. Used by the signed-in account page. */
export async function purchasesFor(email: string): Promise<Purchase[]> {
  if (!has.stripe()) return [];
  const out: Purchase[] = [];
  const seen = new Set<string>();
  for (const variant of new Set([email, email.toLowerCase()])) {
    for await (const s of stripe().checkout.sessions.list({ customer_details: { email: variant }, status: "complete", limit: 100, expand: ["data.subscription"] })) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      const m = (s.metadata || {}) as Record<string, string>;
      if (!m.product || m.product === "credits") continue;
      const sub = s.subscription && typeof s.subscription !== "string" ? s.subscription : null;
      out.push({
        sessionId: s.id,
        product: m.product as Product,
        business: m.name || "Your business",
        placeId: m.placeId || "",
        industry: m.industry || "",
        created: s.created,
        active: sub ? ["active", "trialing", "past_due"].includes(sub.status) : undefined,
      });
    }
  }
  return out.sort((a, b) => b.created - a.created);
}
