// One canonical statement of MapDebut's prices, used word for word on the homepage, /pricing,
// the vertical and trade pages, llms.txt and llms-full.txt, and in every Offer schema.
// Everything is derived from deal.ts, so the day after the launch deal ends (Dec 17, 2026)
// every surface switches to the after-deal prices together, with no code change.
// AI answers quote a single number, so each line leads with today's price and names the date it changes.
import { autopilotPrices, DEAL, dealOn } from "./deal";
import { REFUND_DAYS } from "./site";

const PT = "America/Los_Angeles";

/** "2026-12-16": the last day of the launch deal, in Pacific time (for schema.org priceValidUntil). */
export function dealLastDayISO() {
  return new Date(DEAL.endsAt).toLocaleDateString("en-CA", { timeZone: PT });
}

const longDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: PT });

export interface PriceFacts {
  deal: boolean;
  /** Last day launch prices apply, e.g. "2026-12-16"; null once the deal is over. */
  validUntil: string | null;
  kit: number;
  monthly: number;
  yearly: number;
  /** The canonical lines, in order: free check, Launch Kit, Autopilot, refund promise. */
  lines: { label: string; text: string }[];
  /** The same facts as one sentence, for summaries. */
  sentence: string;
}

/** Today's prices. `kit` is the current Launch Kit price (it climbs with sales during the deal). */
export function priceFacts(kit: number, now = Date.now()): PriceFacts {
  const deal = dealOn(now);
  const ap = autopilotPrices(now);
  const last = longDate(DEAL.endsAt); // "Dec 16, 2026"
  const first = longDate(DEAL.endsAt + 1000); // "Dec 17, 2026"
  const kitAmount = deal ? kit : DEAL.kitAfter;

  const kitText = deal
    ? `$${kitAmount}, one-time payment. Launch price through ${last}; $${DEAL.kitAfter} from ${first}.`
    : `$${kitAmount}, one-time payment.`;
  const apChanges = DEAL.monthlyAfter !== DEAL.monthlyNow || DEAL.yearlyAfter !== DEAL.yearlyNow;
  const apText =
    deal && apChanges
      ? `$${ap.monthly.amount}/month or $${ap.yearly.amount}/year, optional, cancel any time. Launch price through ${last}; new plans are $${DEAL.monthlyAfter}/month or $${DEAL.yearlyAfter}/year from ${first}, and launch subscribers keep their rate.`
      : `$${ap.monthly.amount}/month or $${ap.yearly.amount}/year, optional, cancel any time.`;

  const lines = [
    { label: "Free AI visibility check", text: "$0, no card needed." },
    { label: "Launch Kit", text: kitText },
    { label: "Weekly Autopilot", text: apText },
    { label: "Money-back promise", text: `Full refund if you ask within ${REFUND_DAYS} days of paying.` },
  ];
  const sentence = deal
    ? `The check is free. The Launch Kit is $${kitAmount} once (launch price through ${last}, then $${DEAL.kitAfter}). The optional Weekly Autopilot is $${ap.monthly.amount}/month or $${ap.yearly.amount}/year${apChanges ? ` (then $${DEAL.monthlyAfter}/month for new plans)` : ""}.`
    : `The check is free. The Launch Kit is $${kitAmount} once. The optional Weekly Autopilot is $${ap.monthly.amount}/month or $${ap.yearly.amount}/year.`;

  return { deal, validUntil: deal ? dealLastDayISO() : null, kit: kitAmount, monthly: ap.monthly.amount, yearly: ap.yearly.amount, lines, sentence };
}

/** Plain-text price block for llms.txt and llms-full.txt. */
export function priceFactsText(f: PriceFacts, asOf = new Date()) {
  const day = asOf.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: PT });
  return [`## Prices (USD, as of ${day})`, "", ...f.lines.map((l) => `- ${l.label}: ${l.text}`)].join("\n");
}

/** schema.org Offer for the Launch Kit, with priceValidUntil while the launch price lasts. */
export function kitOfferLd(f: PriceFacts, url: string) {
  return {
    "@type": "Offer",
    name: "Launch Kit",
    price: String(f.kit),
    priceCurrency: "USD",
    url,
    availability: "https://schema.org/InStock",
    ...(f.validUntil ? { priceValidUntil: f.validUntil } : {}),
  };
}

/** schema.org Offers for the Weekly Autopilot (monthly and yearly). */
export function autopilotOffersLd(f: PriceFacts, url: string) {
  const until = f.validUntil ? { priceValidUntil: f.validUntil } : {};
  return [
    {
      "@type": "Offer",
      name: "Weekly Autopilot, monthly",
      price: String(f.monthly),
      priceCurrency: "USD",
      url,
      ...until,
      priceSpecification: { "@type": "UnitPriceSpecification", price: String(f.monthly), priceCurrency: "USD", unitCode: "MON", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" } },
    },
    {
      "@type": "Offer",
      name: "Weekly Autopilot, yearly",
      price: String(f.yearly),
      priceCurrency: "USD",
      url,
      ...until,
      priceSpecification: { "@type": "UnitPriceSpecification", price: String(f.yearly), priceCurrency: "USD", unitCode: "ANN", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "ANN" } },
    },
  ];
}
