// The launch deal: a fixed, real deadline (the end of the Ship or Die hackathon).
// Before it, launch prices apply. After it, the prices below apply to new buyers,
// and everyone who subscribed during the deal keeps the rate they signed up at.
// No resetting timers: only ever move NEXT_PUBLIC_DEAL_ENDS_AT to a later date you announce.

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const DEAL = {
  endsAt: Date.parse(process.env.NEXT_PUBLIC_DEAL_ENDS_AT || "2026-12-17T07:59:59Z"), // Dec 16, 11:59 PM Pacific
  kitAfter: num(process.env.KIT_PRICE_AFTER_DEAL, 199),
  monthlyNow: num(process.env.AUTOPILOT_MONTHLY_PRICE, 39),
  yearlyNow: num(process.env.AUTOPILOT_YEARLY_PRICE, 349),
  monthlyAfter: num(process.env.AUTOPILOT_MONTHLY_AFTER_DEAL, 49),
  yearlyAfter: num(process.env.AUTOPILOT_YEARLY_AFTER_DEAL, 449),
};

/** Free Autopilot days included with the Launch Kit (always, not only during the deal). */
export const KIT_TRIAL_DAYS = num(process.env.KIT_AUTOPILOT_TRIAL_DAYS, 7);

export const dealOn = (now = Date.now()) => now < DEAL.endsAt;

export function autopilotPrices(now = Date.now()) {
  const on = dealOn(now);
  const m = on ? DEAL.monthlyNow : DEAL.monthlyAfter;
  const y = on ? DEAL.yearlyNow : DEAL.yearlyAfter;
  const save = m * 12 - y;
  return {
    monthly: { amount: m, label: `$${m}`, note: "per month" },
    yearly: { amount: y, label: `$${y}`, note: save > 0 ? `per year (save $${save})` : "per year", save },
  };
}

/** "Dec 16" in Pacific time, the day the deal ends. */
export function dealEndLabel() {
  return new Date(DEAL.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" });
}

/** What changes when the deal ends, e.g. "the Launch Kit is $199 and Autopilot is $49/mo". */
export function afterDealText() {
  const parts = [`the Launch Kit is $${DEAL.kitAfter}`];
  if (DEAL.monthlyAfter !== DEAL.monthlyNow) parts.push(`Autopilot is $${DEAL.monthlyAfter}/mo`);
  return parts.join(" and ");
}
