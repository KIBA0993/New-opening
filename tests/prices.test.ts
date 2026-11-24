// The canonical price block (src/lib/priceFacts.ts). Runs with `npm test` on every build.
// Checks both sides of the launch deal so the Dec 17 switch is proven before it happens.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEAL } from "../src/lib/deal";
import { kitOfferLd, priceFacts, priceFactsText } from "../src/lib/priceFacts";

const during = Date.parse("2026-11-24T12:00:00Z");
const lastMinute = DEAL.endsAt - 1;
const after = DEAL.endsAt + 1000;

test("deal ends at the close of Dec 16, Pacific", () => {
  assert.equal(priceFacts(79, lastMinute).deal, true);
  assert.equal(priceFacts(79, after).deal, false);
});

test("during the deal: today's price first, end date and after price named", () => {
  const f = priceFacts(79, during);
  assert.equal(f.validUntil, "2026-12-16");
  assert.equal(f.kit, 79);
  const kit = f.lines.find((l) => l.label === "Launch Kit")!.text;
  assert.match(kit, /^\$79, one-time payment\. Launch price through Dec 16, 2026; \$199 from Dec 17, 2026\.$/);
  assert.match(f.lines.find((l) => l.label === "Weekly Autopilot")!.text, /^\$39\/month or \$349\/year.*\$49\/month or \$449\/year from Dec 17, 2026/);
  assert.equal(kitOfferLd(f, "x").priceValidUntil, "2026-12-16");
  assert.match(priceFactsText(f, new Date(during)), /^## Prices \(USD, as of Nov 24, 2026\)/);
});

test("after the deal: one price each, no launch wording, no priceValidUntil", () => {
  const f = priceFacts(79, after);
  assert.equal(f.kit, 199);
  assert.equal(f.monthly, 49);
  assert.equal(f.yearly, 449);
  assert.equal(f.validUntil, null);
  assert.equal("priceValidUntil" in kitOfferLd(f, "x"), false);
  const all = f.lines.map((l) => l.text).join(" ") + f.sentence;
  assert.doesNotMatch(all, /launch (price|deal|subscriber)|\$79\b|\$39\b|\$349\b|Dec 1[67]/i);
});
