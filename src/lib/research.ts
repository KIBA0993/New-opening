// Our own study: do AI assistants know about businesses that just opened?
// Numbers come from scripts/study-new-businesses.ts (study-out/summary.json), run Nov 23, 2026.
// Keep counts next to percentages: the sample is small, and readers should be able to check the math.

export const STUDY = {
  slug: "new-business-ai-visibility",
  ran: "2026-11-23",
  city: "Chicago",
  licensesInWindow: 1931,
  sampled: 100,
  onMaps: { n: 72, of: 100 },
  zeroReviews: { n: 7, of: 72 },
  under10Reviews: { n: 26, of: 72 },
  medianReviews: 24,
  withWebsite: { n: 53, of: 72 },
  namedForCategory: { n: 5, of: 100 },
  namedWithWebsite: { n: 4, of: 53 },
  namedNoWebsite: { n: 1, of: 47 },
  foundByName: { n: 75, of: 100 },
  foundByNameOnMaps: { n: 59, of: 72 },
  foundByNameNotOnMaps: { n: 16, of: 28 },
  byCategory: [
    { label: "Restaurants", n: 22, onMaps: 68.2, named: 4.5, found: 90.9 },
    { label: "Hair salons and barbers", n: 22, onMaps: 63.6, named: 0, found: 68.2 },
    { label: "Nail salons", n: 22, onMaps: 72.7, named: 9.1, found: 72.7 },
    { label: "Massage and spas", n: 22, onMaps: 81.8, named: 4.5, found: 59.1 },
    { label: "Gyms and fitness studios", n: 12, onMaps: 75, named: 8.3, found: 91.7 },
  ],
};

export const pct = (x: { n: number; of: number }) => `${Math.round((100 * x.n) / x.of)}%`;
