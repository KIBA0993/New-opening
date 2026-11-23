// Our own study: do AI assistants know about businesses that just opened?
// Numbers come from scripts/study-new-businesses.ts (study-out/summary.json), run Nov 23, 2026.
// Keep counts next to percentages: the sample is small, and readers should be able to check the math.

export const STUDY = {
  slug: "new-business-ai-visibility",
  ran: "2026-11-23",
  city: "Chicago",
  licensesInWindow: 1931,
  sampled: 122,
  onMaps: { n: 85, of: 122 },
  zeroReviews: { n: 8, of: 85 },
  under10Reviews: { n: 30, of: 85 },
  medianReviews: 19,
  withWebsite: { n: 65, of: 85 },
  namedForCategory: { n: 6, of: 122 },
  namedWithWebsite: { n: 5, of: 65 },
  namedNoWebsite: { n: 1, of: 57 },
  foundByName: { n: 89, of: 122 },
  foundByNameOnMaps: { n: 70, of: 85 },
  foundByNameNotOnMaps: { n: 19, of: 37 },
  byCategory: [
    { label: "Restaurants", n: 22, onMaps: 68.2, named: 4.5, found: 90.9 },
    { label: "Hair salons and barbers", n: 22, onMaps: 63.6, named: 0, found: 68.2 },
    { label: "Nail salons", n: 22, onMaps: 72.7, named: 9.1, found: 72.7 },
    { label: "Massage and spas", n: 22, onMaps: 81.8, named: 4.5, found: 59.1 },
    { label: "Gyms and fitness studios", n: 22, onMaps: 68.2, named: 4.5, found: 86.4 },
    { label: "Pet groomers and pet care", n: 12, onMaps: 58.3, named: 8.3, found: 50 },
  ],
};

export const pct = (x: { n: number; of: number }) => `${Math.round((100 * x.n) / x.of)}%`;
