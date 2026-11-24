// The free business name checker (/tools/business-name-checker). Runs with `npm test` on every build.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkBusinessName } from "../src/lib/nameCheck";

const cases: { name: string; city?: string; onSignage?: boolean; risk: string; suggestion?: string | null }[] = [
  { name: "Rosa's Nails", risk: "none", suggestion: null },
  { name: "Sun & Moon Cafe", risk: "none" },
  { name: "Juniper Kitchen", city: "Austin", risk: "none" },
  { name: "Best Plumber Austin | 24/7 Emergency Plumbing", city: "Austin", risk: "high", suggestion: "Plumber" },
  { name: "Bright Day Cleaning - Affordable House Cleaning Austin", city: "Austin", risk: "high", suggestion: "Bright Day Cleaning" },
  { name: "Joe's Locksmith 512-555-0134", risk: "high", suggestion: "Joe's Locksmith" },
  { name: "Wag & Wash Grooming ★★★★★", risk: "medium", suggestion: "Wag & Wash Grooming" },
  { name: "Austin Pet Spa", city: "Austin", onSignage: true, risk: "low" },
  { name: "Austin Pet Spa", city: "Austin", risk: "medium", suggestion: "Pet Spa" },
  { name: "TACO RUEDA", risk: "low" },
  { name: "Lone Star Maids LLC", risk: "low" },
  { name: "Holy Crepe! sweetholycrepe.com", risk: "high", suggestion: "Holy Crepe!" },
];

for (const c of cases) {
  test(`name check: ${c.name}`, () => {
    const r = checkBusinessName(c.name, { city: c.city, onSignage: c.onSignage });
    assert.equal(r.risk, c.risk, JSON.stringify(r.issues.map((i) => i.title)));
    if (c.suggestion !== undefined) assert.equal(r.suggestion, c.suggestion);
    for (const i of r.issues) assert.ok(i.why.length > 20);
  });
}

test("name check: empty input", () => {
  assert.equal(checkBusinessName("  ").risk, "none");
});
