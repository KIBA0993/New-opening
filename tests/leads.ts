// Real leads whose free check came out wrong, plus a few ordinary businesses that must NOT be asked
// anything. Google data is what the Places API returned for them (Nov 2026); the HTML keeps what
// mattered on each homepage (title, headings, how far into the page the text starts, the words used).
// Add a case here every time a report comes out wrong for a lead, before fixing it.

import type { DoubtKind } from "../src/lib/confidence";
import type { IndustrySlug, Place } from "../src/lib/types";

export interface Lead {
  why: string; // what went wrong, or why it's here
  real: boolean; // a real lead (false: a typical business built to guard against over-asking)
  place: Place;
  html?: string; // homepage as our server fetches it (no JavaScript run)
  industryFromLink?: IndustrySlug; // ?industry= on the report link, when the start flow set one
  expect: {
    doubts: DoubtKind[]; // exactly these, in any order
    term?: string; // the business type we prefill for the owner (or use, when there are no doubts)
    termNot?: RegExp; // the term must never look like this
    industry?: IndustrySlug;
    phoneOnSite?: boolean; // the site shows the same phone as Google
  };
  // When the owner confirms a business type, the questions we ask AI must use it.
  owner?: { term: string; town: string; promptHas: RegExp; promptNot?: RegExp };
}

/** A homepage shaped like a website builder's: a big block of scripts in <head> before any visible text. */
function page(o: { title: string; desc?: string; h1?: string; body: string; headScriptKb?: number }) {
  const pad = o.headScriptKb ? `<script>${"var x=1;".repeat(Math.ceil((o.headScriptKb * 1024) / 8))}</script>` : "";
  return `<!doctype html><html><head><title>${o.title}</title>${o.desc ? `<meta name="description" content="${o.desc}">` : ""}${pad}</head><body>${o.h1 ? `<h1>${o.h1}</h1>` : ""}${o.body}</body></html>`;
}

const repeat = (s: string, n: number) => Array(n).fill(s).join(" ");

export const LEADS: Lead[] = [
  {
    why: "IMpossible Pilates (Irvine). Google says 'Health', so rivals were urgent cares and questions asked for 'best health'. Phone in the Wix footer 950 KB into the page read as missing.",
    real: true,
    place: {
      id: "test_impossible_pilates",
      name: "IMpossible Pilates",
      address: "Irvine, CA 92618, USA",
      city: "Irvine, CA",
      phone: "(949) 555-0142",
      website: "https://www.impossiblepilates.com/",
      primaryType: "health",
      primaryTypeLabel: "Health",
      types: ["health", "point_of_interest", "establishment"],
      lat: 33.68,
      lng: -117.79,
      status: "OPERATIONAL",
      reviewCount: 40,
      rating: 5,
    },
    html: page({
      title: "IMpossible Pilates | Private Home Reformer Pilates Studio in Irvine",
      headScriptKb: 820,
      body: `<nav>Home About Classes Contact</nav><section>${repeat("Private reformer pilates sessions in our Irvine home studio.", 12)} Good for your health.</section><footer>Call (949) 555-0142 · Irvine, CA</footer>`,
    }),
    expect: { doubts: ["category"], term: "pilates studio", industry: "wellness", termNot: /health|clinic|urgent/, phoneOnSite: true },
    owner: { term: "pilates studio", town: "Irvine, CA", promptHas: /pilates studio/, promptNot: /best health/ },
  },
  {
    why: "Body Mind Stretch (Morrisville, NC). Hidden address, Google says 'Health', and 'Stretch' in the name was read as a stretching studio. She's a health coach; site text starts 4.8 MB in.",
    real: true,
    place: {
      id: "ChIJb2082QB42wkR9LGX0hijR-g",
      name: "Body Mind Stretch",
      address: "",
      phone: "(919) 555-0177",
      website: "https://www.bodymindstretch.com/",
      primaryType: "health",
      primaryTypeLabel: "Health",
      types: ["health", "point_of_interest", "establishment"],
      status: "OPERATIONAL",
      serviceArea: true,
      reviewCount: 6,
    },
    html: page({
      title: "Body Mind Stretch | Health Coaching",
      desc: "Body Mind Stretch offers transformative well-being journeys for individuals and corporations through health coaching. Our holistic approach includes yoga, meditation, journaling, and leadership development.",
      h1: "STRETCH YOUR BODY. STRETCH YOUR MIND.",
      headScriptKb: 4700,
      body: `About Coaching Services Blog Contact Free Coaching ${repeat("Somatic wellness coaching for busy professionals.", 6)} yoga meditation`,
    }),
    expect: { doubts: ["hidden-address", "category"], term: "health coach", industry: "wellness", termNot: /stretch/ },
    owner: { term: "health coach", town: "Morrisville, NC", promptHas: /health coach/, promptNot: /stretch|sore back/ },
  },
  {
    why: "Plaza Production One: searching the name found only an old, permanently closed listing at 2222 Foothill Blvd (La Cañada Flintridge), and the report called it live.",
    real: true,
    place: {
      id: "ChIJ9cAF4wyTwoARsWC8sZSj3y4",
      name: "Plaza Production One",
      address: "2222 Foothill Blvd, La Cañada Flintridge, CA 91011, USA",
      city: "La Cañada Flintridge, CA",
      website: "https://plazaproductionone.com/",
      primaryType: "association_or_organization",
      primaryTypeLabel: "Association / Organization",
      types: ["association_or_organization", "point_of_interest", "establishment"],
      lat: 34.21,
      lng: -118.2,
      status: "CLOSED_PERMANENTLY",
      reviewCount: 6,
      rating: 2.3,
    },
    expect: { doubts: ["closed", "category"] },
  },
  {
    why: "Plaza Production One's real listing: a mobile dance program at schools. Hidden address; Google's data says 'Sports School' (Maps shows 'Dance school'). Report searched 'sports school' and compared it with a country club.",
    real: true,
    place: {
      id: "ChIJFTRKTpqhNiERPv0plO_Z4ls",
      name: "Plaza Production One",
      address: "",
      phone: "(818) 555-0199",
      website: "https://plazaproductionone.com/",
      primaryType: "sports_school",
      primaryTypeLabel: "Sports School",
      types: ["sports_school", "school", "point_of_interest", "establishment"],
      status: "OPERATIONAL",
      serviceArea: true,
      reviewCount: 14,
      rating: 4.7,
    },
    html: page({
      title: "Plaza Production One | In-Person &amp; Virtual Dance Classes",
      desc: "Plaza Production One’s Mobile Dance Company Programs provide enriching extracurricular activities for students and movement classes for seniors.",
      h1: "Southern California’s Premier Mobile Dance Studio",
      body: `Dance Classes Birthday Parties Mobile Dance Classes Senior Fitness Classes ${repeat("We bring ballet, jazz and hip hop dance classes to your school.", 8)}`,
    }),
    expect: { doubts: ["hidden-address", "category"], term: "dance studio", industry: "wellness", termNot: /sports|association/ },
    owner: { term: "dance studio", town: "La Cañada Flintridge, CA", promptHas: /dance/, promptNot: /sports school|sore back/ },
  },
  {
    why: "Mobile dog groomer with a hidden address: only the town is in doubt, the category is right.",
    real: false,
    place: {
      id: "test_mobile_groomer",
      name: "Suds on Wheels Mobile Grooming",
      address: "",
      phone: "(404) 555-0110",
      website: "https://example.com/suds",
      primaryType: "pet_groomer",
      primaryTypeLabel: "Pet groomer",
      types: ["pet_groomer", "pet_care", "point_of_interest", "establishment"],
      status: "OPERATIONAL",
      serviceArea: true,
      reviewCount: 22,
    },
    html: page({ title: "Suds on Wheels | Mobile Dog Grooming", body: `${repeat("Full-service mobile dog grooming at your door.", 4)} Call 404-555-0110` }),
    expect: { doubts: ["hidden-address"], industry: "pet", term: "pet groomer", phoneOnSite: true },
  },
  {
    why: "Tutoring center that Google files under 'Educational institution'.",
    real: false,
    place: {
      id: "test_tutoring",
      name: "Bright Path Learning",
      address: "100 Main St, Cary, NC 27511, USA",
      city: "Cary, NC",
      website: "https://example.com/brightpath",
      primaryType: "educational_institution",
      primaryTypeLabel: "Educational institution",
      types: ["educational_institution", "point_of_interest", "establishment"],
      lat: 35.79,
      lng: -78.78,
      status: "OPERATIONAL",
      reviewCount: 9,
    },
    html: page({ title: "Bright Path Learning | Math and Reading Tutoring in Cary", body: repeat("One-on-one tutoring and SAT test prep.", 4) }),
    expect: { doubts: ["category"], term: "tutoring", industry: "wellness" },
  },
  {
    why: "Karate school with the right category but no set of questions for it: ask instead of using home-services questions.",
    real: false,
    place: {
      id: "test_karate",
      name: "Iron Crane Dojo",
      address: "50 Oak Ave, Austin, TX 78701, USA",
      city: "Austin, TX",
      primaryType: "martial_arts_school",
      primaryTypeLabel: "Martial arts school",
      types: ["martial_arts_school", "point_of_interest", "establishment"],
      lat: 30.27,
      lng: -97.74,
      status: "OPERATIONAL",
      reviewCount: 30,
    },
    expect: { doubts: ["no-industry"] },
  },
  // ----- Ordinary businesses: the check must run straight away, with no questions. -----
  {
    why: "Nail salon with a storefront and the right category.",
    real: false,
    place: {
      id: "test_nails",
      name: "Polished Nail Bar",
      address: "12 Peachtree St, Atlanta, GA 30303, USA",
      city: "Atlanta, GA",
      phone: "(404) 555-0123",
      website: "https://example.com/polished",
      primaryType: "nail_salon",
      primaryTypeLabel: "Nail salon",
      types: ["nail_salon", "beauty_salon", "point_of_interest", "establishment"],
      lat: 33.75,
      lng: -84.39,
      status: "OPERATIONAL",
      reviewCount: 120,
    },
    html: page({ title: "Polished Nail Bar | Gel manicures in Atlanta", body: `${repeat("Gel manicures, pedicures and nail art.", 3)} <a href="tel:+14045550123">Call us</a>` }),
    expect: { doubts: [], term: "nail salon", industry: "beauty", phoneOnSite: true },
  },
  {
    why: "Med spa Google files under 'Spa'.",
    real: false,
    place: {
      id: "test_medspa",
      name: "Glow Med Spa",
      address: "9 Elm St, Irvine, CA 92618, USA",
      city: "Irvine, CA",
      website: "https://example.com/glow",
      primaryType: "spa",
      primaryTypeLabel: "Spa",
      types: ["spa", "skin_care_clinic", "point_of_interest", "establishment"],
      lat: 33.68,
      lng: -117.8,
      status: "OPERATIONAL",
      reviewCount: 80,
    },
    html: page({ title: "Glow Med Spa | Botox and fillers", body: repeat("Our med spa offers Botox, fillers and facials.", 3) }),
    expect: { doubts: [], term: "med spa", industry: "wellness" },
  },
  {
    why: "Chiropractor with the right category and no website.",
    real: false,
    place: {
      id: "test_chiro",
      name: "Align Family Chiropractic",
      address: "77 Pine Rd, Morrisville, NC 27560, USA",
      city: "Morrisville, NC",
      primaryType: "chiropractor",
      primaryTypeLabel: "Chiropractor",
      types: ["chiropractor", "health", "point_of_interest", "establishment"],
      lat: 35.82,
      lng: -78.83,
      status: "OPERATIONAL",
      reviewCount: 55,
    },
    expect: { doubts: [], term: "chiropractor", industry: "wellness" },
  },
  {
    why: "Food truck: hidden address is normal, but it's still a hidden address, so we ask the town.",
    real: false,
    place: {
      id: "test_truck",
      name: "Birria Boys",
      address: "",
      primaryType: "food_truck",
      primaryTypeLabel: "Food truck",
      types: ["food_truck", "restaurant", "food", "point_of_interest", "establishment"],
      status: "OPERATIONAL",
      serviceArea: true,
      reviewCount: 15,
    },
    expect: { doubts: ["hidden-address"], term: "food truck", industry: "food-trucks" },
  },
];
