// Run with `npm test`. Runs on every Vercel build too, so a change that breaks a known lead never ships.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkConfidence } from "../src/lib/confidence";
import { buildPrompts, guessIndustry, industryBySlug, industryForTerm, searchTerm } from "../src/lib/industries";
import { homepageFacts, MAX_HTML } from "../src/lib/siteText";
import { LEADS } from "./leads";

for (const lead of LEADS) {
  test(`${lead.place.name} (${lead.place.id}): ${lead.why.slice(0, 70)}`, () => {
    // Only the first MAX_HTML characters are read on the live site, so the test reads the same.
    const site = lead.html ? homepageFacts(lead.html.slice(0, MAX_HTML), lead.place) : null;
    const conf = checkConfidence(lead.place, site, lead.industryFromLink);

    assert.deepEqual([...conf.doubts.map((d) => d.kind)].sort(), [...lead.expect.doubts].sort(), "doubts");
    if (lead.expect.term) assert.equal(conf.term, lead.expect.term, "suggested business type");
    if (lead.expect.termNot) assert.doesNotMatch(conf.term, lead.expect.termNot, "suggested business type");
    if (lead.expect.industry) assert.equal(conf.industry, lead.expect.industry, "industry");
    if (lead.expect.phoneOnSite !== undefined) assert.equal(site?.phone, lead.expect.phoneOnSite, "phone found on the website");
    for (const d of conf.doubts) assert.ok(d.note.length > 10 && !/undefined/.test(d.note), "doubt note reads well");

    if (lead.owner) {
      // The owner confirms the form: their words drive the questions and the rival search.
      const place = { ...lead.place, ownerTerm: lead.owner.term, city: lead.owner.town };
      const slug = industryForTerm(lead.owner.term) || conf.industry || guessIndustry(place.types, place.primaryType, place.name) || "home-services";
      const industry = industryBySlug(slug)!;
      const term = searchTerm(industry, place.primaryTypeLabel, place);
      assert.equal(term, lead.owner.term);
      const prompts = buildPrompts(industry, term, lead.owner.town).join(" | ");
      assert.match(prompts, lead.owner.promptHas);
      if (lead.owner.promptNot) assert.doesNotMatch(prompts, lead.owner.promptNot);
      assert.doesNotMatch(prompts, / in \s*[|?.]|undefined/, "questions name the town");
    }
  });
}

test("the set keeps at least 3 ordinary businesses that get no questions", () => {
  assert.ok(LEADS.filter((l) => l.expect.doubts.length === 0).length >= 3);
});
