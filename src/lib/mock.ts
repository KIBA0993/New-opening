// Realistic demo data used whenever an API key is missing.
// Everything is seeded from the input so the same business always gets the same result.
import type { IndustrySlug, Place } from "./types";

export function seeded(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const RIVALS: Record<IndustrySlug, string[]> = {
  "home-services": ["Sparkle & Shine Cleaning", "Lone Star Maids", "Hill Country Home Care", "TidyNest Co.", "Bluebonnet Cleaners", "Eastside Handy Pros"],
  beauty: ["Polished Nail Lounge", "The Gilded Tip", "Luxe Lash Studio", "Bloom Nail Bar", "South Congress Nails", "Velvet Brow & Lash"],
  "food-trucks": ["Taco Rueda", "The Rolling Biscuit", "Smoke & Saddle BBQ", "Kimchi Wagon", "Holy Crepe!", "Mesa Mobile Eats"],
  pet: ["Wag & Wash Grooming", "Barkside Pet Spa", "Happy Tails Mobile", "The Dapper Dog", "Paws on Main", "Fetch Grooming Co."],
  wellness: ["Align Chiropractic", "Restore Massage Studio", "Greenleaf Wellness", "Core Balance PT", "Still Water Spa", "Elm Street Therapy"],
  restaurants: ["Juniper Kitchen", "Little Fig Café", "Ember & Oak", "Casa Lupita", "The Corner Bakehouse", "Noodle Theory"],
};

const STREETS = ["S Congress Ave", "E Cesar Chavez St", "Burnet Rd", "N Lamar Blvd", "Manor Rd", "S 1st St", "W Anderson Ln"];

export const DEMO_CITY = "Austin, TX";
const DEMO_CENTER = { lat: 30.2672, lng: -97.7431 };

function mockAddress(r: () => number) {
  return `${Math.floor(r() * 4800 + 200)} ${STREETS[Math.floor(r() * STREETS.length)]}, Austin, TX 787${Math.floor(r() * 50 + 10)}`;
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

export function mockSearch(q: string): Place[] {
  const query = q.trim();
  if (!query) return [];
  // Type "not listed" or "brand new" to see the not-found path in demo mode.
  if (/not listed|brand new|zzz/i.test(query)) return [];
  const r = seeded(query.toLowerCase());
  const isPhone = query.replace(/\D/g, "").length >= 10;
  const name = isPhone ? "Bright Day Cleaning Co." : titleCase(query.replace(/,.*/, ""));
  const base: Place = {
    id: `demo_${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`,
    name,
    address: mockAddress(r),
    city: DEMO_CITY,
    phone: isPhone ? query : `(512) 555-0${Math.floor(r() * 900 + 100)}`,
    rating: Math.round((4 + r()) * 10) / 10,
    reviewCount: Math.floor(r() * 9) + 2,
    primaryType: "",
    primaryTypeLabel: "",
    types: [],
    lat: DEMO_CENTER.lat + (r() - 0.5) * 0.05,
    lng: DEMO_CENTER.lng + (r() - 0.5) * 0.05,
    status: "OPERATIONAL",
  };
  if (isPhone) return [base];
  const second: Place = {
    ...base,
    id: base.id + "_2",
    address: mockAddress(r),
    rating: undefined,
    reviewCount: 0,
  };
  return [base, second];
}

export function mockPlace(id: string): Place {
  const slug = decodeURIComponent(id.replace(/^demo_/, "").replace(/_2$/, ""));
  return mockSearch(slug.replace(/-/g, " "))[id.endsWith("_2") ? 1 : 0] ?? mockSearch("demo business")[0];
}

export function mockRivals(industry: IndustrySlug, seed: string): Place[] {
  const r = seeded(seed + industry);
  return RIVALS[industry].slice(0, 5).map((name, i) => ({
    id: `demo_rival_${industry}_${i}`,
    name,
    address: mockAddress(r),
    city: DEMO_CITY,
    rating: Math.round((4.2 + r() * 0.8) * 10) / 10,
    reviewCount: Math.floor(40 + r() * 400),
    primaryTypeLabel: "",
    lat: DEMO_CENTER.lat + (r() - 0.5) * 0.04,
    lng: DEMO_CENTER.lng + (r() - 0.5) * 0.04,
    website: r() > 0.3 ? `https://example.com/${i}` : undefined,
  }));
}
