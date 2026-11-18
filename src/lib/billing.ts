import "server-only";
import Stripe from "stripe";
import { env, has, PRICES } from "./env";
import { kitPrice } from "./pricing";
import { cleanUrl } from "./url";
import { dealOn, KIT_TRIAL_DAYS } from "./deal";
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
    website: cleanUrl(m.website || undefined),
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

/** The Autopilot line item. Saved Stripe price IDs hold the launch prices, so they're only used during the deal. */
function autopilotItem(interval: "monthly" | "yearly", business: string): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = dealOn() ? (interval === "monthly" ? env.stripePriceMonthly : env.stripePriceYearly) : "";
  if (priceId) return { price: priceId, quantity: 1 };
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: PRICES[interval].amount * 100,
      product_data: { name: "MapDebut Weekly Autopilot", description: `A weekly email for ${business}: AI recommendation check, rival moves, a Google post and review replies written, local events. Cancel any time.` },
      recurring: { interval: interval === "monthly" ? "month" : "year" },
    },
  };
}

/** The renewal date for a trial that starts today, e.g. "November 25, 2026". */
export function trialEndLabel(fromMs = Date.now()) {
  return new Date(fromMs + KIT_TRIAL_DAYS * 864e5).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Product "kit" is the Launch Kit plus a free first week of the Weekly Autopilot, which then renews
 * monthly until cancelled (one Stripe checkout: the kit is charged today, the Autopilot starts as a trial).
 * "kit_only" is the Launch Kit alone.
 */
export async function createCheckout(product: Product | "kit_only", profile: OwnerProfile): Promise<string> {
  const back = `${env.siteUrl}/report/${encodeURIComponent(profile.placeId)}?industry=${profile.industry}`;
  const isKit = product === "kit" || product === "kit_only";
  const bundle = product === "kit" && KIT_TRIAL_DAYS > 0;
  if (!has.stripe()) {
    const sid = demoSessionId(profile, isKit ? "kit" : (product as Product));
    return isKit ? `${env.siteUrl}/kit?session_id=${sid}` : `${env.siteUrl}/autopilot/welcome?session_id=${sid}`;
  }
  // The kit has a rising launch price, so it's always charged at today's amount (not a fixed price ID).
  const kitAmount = isKit ? (await kitPrice(true)).amount : 0;
  const metadata: Record<string, string> = {
    ...profileToMetadata(profile),
    product: isKit ? "kit" : product,
    ...(isKit ? { price: String(kitAmount) } : {}),
    ...(bundle ? { bundle: "1" } : {}),
  };
  const kitItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: kitAmount * 100,
      product_data: { name: "MapDebut Launch Kit", description: `Every profile written for ${profile.name}, Google verification coach, guided setup on 6 platforms, review link and QR card. 14-day money-back promise.` },
    },
  };
  const monthly = PRICES.monthly.label;
  const common = {
    customer_email: profile.email || undefined,
    allow_promotion_codes: true,
    metadata,
    cancel_url: back,
  };

  let session: Stripe.Checkout.Session;
  if (product === "kit_only" || (isKit && !bundle)) {
    session = await stripe().checkout.sessions.create({
      ...common,
      mode: "payment",
      line_items: [kitItem],
      payment_intent_data: { metadata },
      success_url: `${env.siteUrl}/kit?session_id={CHECKOUT_SESSION_ID}`,
    });
  } else if (bundle) {
    session = await stripe().checkout.sessions.create({
      ...common,
      mode: "subscription",
      line_items: [kitItem, autopilotItem("monthly", profile.name)],
      subscription_data: {
        metadata,
        trial_period_days: KIT_TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
      custom_text: {
        submit: {
          message: `Today you pay $${kitAmount} for the Launch Kit. Your first ${KIT_TRIAL_DAYS} days of the Weekly Autopilot are free. On ${trialEndLabel()} it renews at ${monthly}/month until you cancel. Cancel any time before then and you won't be charged again: one click from the link in your Kit email.`,
        },
      },
      success_url: `${env.siteUrl}/kit?session_id={CHECKOUT_SESSION_ID}`,
    });
  } else {
    session = await stripe().checkout.sessions.create({
      ...common,
      mode: "subscription",
      line_items: [autopilotItem(product as "monthly" | "yearly", profile.name)],
      subscription_data: { metadata },
      success_url: `${env.siteUrl}/autopilot/welcome?session_id={CHECKOUT_SESSION_ID}`,
    });
  }
  return session.url!;
}

/** For a Kit bought with the free Autopilot week: the subscription's state, for the kit page and email. */
export async function kitTrial(sessionId: string): Promise<{ status: string; renews: string | null; price: string; cancelUrl: string } | null> {
  if (!has.stripe() || sessionId.startsWith(DEMO_PREFIX)) return null;
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const sub = s.subscription && typeof s.subscription !== "string" ? s.subscription : null;
    if (!sub) return null;
    const at = sub.status === "trialing" ? sub.trial_end : sub.items.data[0]?.current_period_end;
    const amount = sub.items.data[0]?.price?.unit_amount;
    return {
      status: sub.cancel_at_period_end ? "canceled" : sub.status,
      renews: at ? new Date(at * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null,
      price: amount ? `$${Math.round(amount / 100)}/month` : `${PRICES.monthly.label}/month`,
      cancelUrl: `${env.siteUrl}/api/cancel?session_id=${encodeURIComponent(sessionId)}`,
    };
  } catch {
    return null;
  }
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
    if (profile && !profile.email) profile.email = s.customer_details?.email || ""; // entered on Stripe's page
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
