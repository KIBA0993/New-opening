import "server-only";
import { unstable_cache } from "next/cache";
import { has } from "./env";
import { stripe } from "./billing";
import { DEAL, dealOn } from "./deal";

// Launch price: the kit starts low and rises a step after every few sales, up to a cap.
export const LAUNCH = {
  start: Number(process.env.KIT_START_PRICE || 79),
  step: Number(process.env.KIT_PRICE_STEP || 10),
  every: Number(process.env.KIT_PRICE_EVERY || 5),
  cap: Number(process.env.KIT_MAX_PRICE || 199),
};

const EXCLUDED = new Set((process.env.KIT_SALES_EXCLUDE || "").split(",").map((x) => x.trim()).filter(Boolean));

/** Paid Launch Kit sales so far, counted from Stripe (no database). */
async function countKitSales(): Promise<number> {
  if (!has.stripe()) return Number(process.env.KIT_DEMO_SALES || 0);
  let n = 0;
  for await (const s of stripe().checkout.sessions.list({ status: "complete", limit: 100 })) {
    // Only real buyers move the price: skip test mode and the owner's own test buys (src "owner",
    // set at checkout for the admin's browsers), plus any session IDs listed in KIT_SALES_EXCLUDE.
    if (s.metadata?.product !== "kit" || s.payment_status !== "paid") continue;
    if (!s.livemode || s.metadata?.src === "owner" || EXCLUDED.has(s.id)) continue;
    n++;
  }
  return n;
}

const cachedSales = unstable_cache(countKitSales, ["kit-sales-v2"], { revalidate: 300, tags: ["kit-sales"] });

export interface KitPrice {
  amount: number;
  label: string;
  sold: number;
  leftAtPrice: number | null;
  next: number | null;
}

export function priceForSales(sold: number, now = Date.now()): KitPrice {
  // After the launch deal ends, everyone pays the announced after-deal price.
  if (!dealOn(now)) return { amount: DEAL.kitAfter, label: `$${DEAL.kitAfter}`, sold, leftAtPrice: null, next: null };
  // During the deal the price never climbs past the after-deal price.
  const cap = Math.min(LAUNCH.cap, DEAL.kitAfter);
  const tier = Math.floor(sold / LAUNCH.every);
  const amount = Math.min(cap, LAUNCH.start + tier * LAUNCH.step);
  const capped = amount >= cap;
  return {
    amount,
    label: `$${amount}`,
    sold,
    leftAtPrice: capped ? null : LAUNCH.every - (sold % LAUNCH.every),
    next: capped ? null : Math.min(cap, amount + LAUNCH.step),
  };
}

/** Current kit price. Checkout charges this exact amount, read fresh at checkout time. */
export async function kitPrice(fresh = false): Promise<KitPrice> {
  try {
    return priceForSales(fresh ? await countKitSales() : await cachedSales());
  } catch (e) {
    console.error("kit sales count failed", e);
    return priceForSales(0);
  }
}

/** Short line under the price, e.g. "Launch price: 3 left before it goes up to $89." */
export function launchNote(p: KitPrice) {
  if (p.leftAtPrice == null) return "one time";
  return `Launch price: ${p.leftAtPrice} left at this price, then $${p.next}.`;
}
