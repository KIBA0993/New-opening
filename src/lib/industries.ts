import type { IndustrySlug } from "./types";

export interface Industry {
  slug: IndustrySlug;
  name: string; // "Home services"
  who: string; // "cleaners, plumbers, HVAC, landscapers and handymen"
  term: string; // default search phrase, e.g. "house cleaner"
  menuWord: string; // "services" or "menu"
  serviceArea: boolean; // usually goes to the customer
  match: RegExp; // matched against Google place types
  hero: { title: string; sub: string };
  pains: { title: string; body: string }[];
  kitExtras: string[];
  promptTemplates: string[]; // {term} and {area}
  campaigns: { title: string; idea: string }[];
  eventKinds: string[];
  servicesPlaceholder: string;
  differentPlaceholder: string;
  faqs: { q: string; a: string }[];
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "home-services",
    name: "Home services",
    who: "cleaners, plumbers, HVAC, landscapers and handymen",
    term: "house cleaner",
    menuWord: "services",
    serviceArea: true,
    match: /plumb|electric|roof|contractor|clean|landscap|hvac|heating|air_condition|handyman|locksmith|painter|moving|pest|pool|lawn|garden|carpet|window|gutter|junk|home_improvement|tree/,
    hero: {
      title: "Get your new home service business found on Google and ChatGPT this week.",
      sub: "Customers ask Google and AI who to call. We write your profiles, coach you through Google's video check, and show you who gets recommended instead of you.",
    },
    pains: [
      { title: "Google's video check keeps failing", body: "Service businesses without a storefront have to film their truck, tools and paperwork. We give you a shot list that passes." },
      { title: "AI recommends the big guys", body: "Ask ChatGPT for the best cleaner in your town and see who it names. We show you exactly why it isn't you yet." },
      { title: "No time for marketing", body: "You're on jobs all day. Everything we write has a copy button, and the weekly email takes five minutes." },
    ],
    kitExtras: ["Service-area setup (hide your home address the right way)", "Truck and tools video shot list", "Before and after post templates"],
    promptTemplates: ["best {term} in {area}", "who should I hire as a {term} near {area}?", "affordable reliable {term} {area}"],
    campaigns: [
      { title: "Winter prep checklist", idea: "Post a 5-point winter checklist for local homes, with a small discount for bookings this month." },
      { title: "Neighbor referral", idea: "Offer $20 off for both the customer and any neighbor they refer on the same street." },
      { title: "Move-in special", idea: "Partner with a local realtor: a first-visit discount card for new homeowners." },
    ],
    eventKinds: ["home and garden shows", "neighborhood association meetings", "community cleanup days", "school fundraisers that take sponsors"],
    servicesPlaceholder: "Deep cleaning, move-out cleaning, weekly cleaning for homes and small offices",
    differentPlaceholder: "Family-owned, eco-friendly products, same-week booking",
    faqs: [
      { q: "I work from home. Will my address show up?", a: "No. We set you up as a service-area business, so customers see the towns you serve, not your house." },
      { q: "Do I need a website?", a: "No. A good Google profile is enough to start. We'll tell you when a simple website would help." },
    ],
  },
  {
    slug: "beauty",
    name: "Beauty and personal care",
    who: "salons, suites, barbers, nail and lash artists",
    term: "nail salon",
    menuWord: "services",
    serviceArea: false,
    match: /beauty|hair|nail|barber|lash|brow|makeup|tanning|salon|wax|skin_care|cosmet/,
    hero: {
      title: "Fill your new chair faster, with Google and ChatGPT sending clients your way.",
      sub: "Just opened a salon or rented a suite? We set up your profiles everywhere clients look, and work alongside your booking app.",
    },
    pains: [
      { title: "Building a clientele from zero", body: "Your regulars followed you, but new clients search 'near me'. We make sure you show up there." },
      { title: "Booking apps don't own your name", body: "Vagaro, Booksy and GlossGenius list you in their app. Google, Apple Maps and ChatGPT are where new clients start." },
      { title: "Reviews feel awkward to ask for", body: "We give you a QR code for your mirror and a text you can send after each visit." },
    ],
    kitExtras: ["Works with your booking link", "Mirror and front-desk QR card", "Service menu written for Google"],
    promptTemplates: ["best {term} in {area}", "{term} near {area} with good reviews", "where to get {term} services in {area}"],
    campaigns: [
      { title: "Holiday glam week", idea: "Offer a party-ready add-on for December bookings and post your open slots every Monday." },
      { title: "Bring a friend", idea: "Book together and both get a free add-on. Great for filling weekday afternoons." },
      { title: "Before and after Friday", idea: "Post one before and after photo every Friday on Google and Instagram." },
    ],
    eventKinds: ["holiday markets", "bridal shows", "pop-up shops", "charity fashion shows"],
    servicesPlaceholder: "Gel manicures, acrylic sets, pedicures, nail art",
    differentPlaceholder: "Private suite, non-toxic polish, evening appointments",
    faqs: [
      { q: "I rent a suite inside a bigger salon. Can I have my own Google profile?", a: "Yes, if you have your own business name and serve clients there during your hours. We walk you through it." },
      { q: "Does this replace my booking app?", a: "No. We add your booking link to every profile, so more people find it." },
    ],
  },
  {
    slug: "food-trucks",
    name: "Food trucks and pop-up vendors",
    who: "food trucks, market stalls, caterers and pop-ups",
    term: "food truck",
    menuWord: "menu",
    serviceArea: true,
    match: /food_truck|vendor|market_stall|caterer|catering|street_food|mobile/,
    hero: {
      title: "Find the best markets and events every week, and get found when you're there.",
      sub: "A weekly list of markets, festivals and vendor calls near you, with a pitch already written. Plus profiles on Google, Yelp and ChatGPT so people can find your truck.",
    },
    pains: [
      { title: "Events are scattered everywhere", body: "Vendor calls are buried across dozens of Facebook groups. We gather them into one weekly email." },
      { title: "People can't find you today", body: "Your location changes. We show you how to keep Google and your followers up to date in seconds." },
      { title: "Holiday season moves fast", body: "December markets fill up early. You'll hear about them before the spots are gone." },
    ],
    kitExtras: ["Weekly vendor calls and markets near you", "Menu written for Google and Yelp", "'Where we are this week' post templates"],
    promptTemplates: ["best {term} in {area}", "{term}s near {area} this week", "where to find good street food in {area}"],
    campaigns: [
      { title: "Where we are this week", idea: "Post your weekly schedule every Monday on Google, Instagram and Facebook." },
      { title: "Holiday market menu", idea: "Add one warm seasonal item and name it after the market you're at." },
      { title: "Office lunch drop", idea: "Offer office parks a weekly lunch visit with a pre-order link." },
    ],
    eventKinds: ["night markets", "holiday markets", "farmers markets", "festivals", "brewery pop-ups", "vendor calls"],
    servicesPlaceholder: "Birria tacos, quesadillas, horchata. Catering for 20 to 200.",
    differentPlaceholder: "Family recipes, handmade tortillas, vegan options",
    faqs: [
      { q: "My truck moves around. Can I still be on Google?", a: "Yes. You list the area you serve, and post where you'll be each week." },
      { q: "Do you book events for me?", a: "No, you stay in charge. We find them and write the pitch, and you send it." },
    ],
  },
  {
    slug: "pet",
    name: "Pet services",
    who: "groomers, trainers, walkers, sitters and daycares",
    term: "dog groomer",
    menuWord: "services",
    serviceArea: false,
    match: /pet|dog|cat_|veterinar|groom|kennel|animal/,
    hero: {
      title: "New pet business? Show up when owners search 'near me'.",
      sub: "Most local groups ban self-promotion. Google, Apple Maps and ChatGPT don't. We set you up on all of them and bring you reviews.",
    },
    pains: [
      { title: "Facebook groups ban promotion", body: "Posting in groups goes nowhere. Owners search Google and ask ChatGPT instead." },
      { title: "Trust comes from reviews", body: "Pet owners read reviews closely. We help you get your first ten." },
      { title: "Mobile or shop, it's confusing", body: "We set up the right kind of profile, whether clients come to you or you go to them." },
    ],
    kitExtras: ["Mobile or storefront setup", "Review cards for pickup time", "Seasonal care post ideas"],
    promptTemplates: ["best {term} in {area}", "{term} near {area} with good reviews", "who is a good {term} in {area}?"],
    campaigns: [
      { title: "Holiday photo day", idea: "Offer a festive bandana and a free photo with every December groom." },
      { title: "New puppy package", idea: "Bundle the first three visits for new puppy owners and post it on Google." },
      { title: "Adoption day partner", idea: "Offer a discount card to families adopting from a local shelter." },
    ],
    eventKinds: ["adoption days", "dog-friendly brewery events", "pet expos", "charity walks"],
    servicesPlaceholder: "Full grooms, bath and brush, nail trims, puppy intro grooms",
    differentPlaceholder: "Fear-free certified, one dog at a time, pickup and drop-off",
    faqs: [
      { q: "I'm mobile. Do I need a shop address?", a: "No. We set you up as a service-area business that lists the neighborhoods you cover." },
      { q: "Can I ask for reviews?", a: "On Google, yes. We give you a link and QR code. On Yelp, asking is against their rules, so we don't." },
    ],
  },
  {
    slug: "wellness",
    name: "Health and wellness",
    who: "chiropractors, therapists, massage studios, gyms and med spas",
    term: "massage therapist",
    menuWord: "services",
    serviceArea: false,
    match: /dentist|doctor|chiropract|physiotherap|wellness|massage|gym|yoga|fitness|medical|health|spa|acupunct|clinic|therap|pilates/,
    hero: {
      title: "Open your practice to new patients from Google and ChatGPT, without an agency.",
      sub: "Agencies charge monthly retainers. We write your profiles, check where AI sends people instead, and keep it fresh every week for a fraction of the cost.",
    },
    pains: [
      { title: "Agencies cost too much", body: "Most new practices can't justify a $1,000 retainer. You can do this yourself in an afternoon with us." },
      { title: "Patients compare before calling", body: "They check reviews, photos and hours. We make sure every profile is complete and matches." },
      { title: "AI answers are new and unclear", body: "We show you exactly what AI assistants say when people ask for your kind of practice." },
    ],
    kitExtras: ["Services written in plain language", "Insurance and booking info on every profile", "Patient review request templates"],
    promptTemplates: ["best {term} in {area}", "{term} near {area} accepting new patients", "recommended {term} in {area}"],
    campaigns: [
      { title: "New year, new routine", idea: "Offer a first-visit special for January and post it in late December." },
      { title: "Desk worker week", idea: "Partner with a nearby office for a short talk or demo." },
      { title: "Meet the team", idea: "Post one short introduction a week so patients know who they'll see." },
    ],
    eventKinds: ["health fairs", "charity runs", "corporate wellness days", "community yoga in the park"],
    servicesPlaceholder: "Deep tissue massage, prenatal massage, sports recovery",
    differentPlaceholder: "Evening and weekend hours, accepts HSA, free parking",
    faqs: [
      { q: "Is this OK for medical practices?", a: "Yes. We never ask for or store patient information. Review requests are general, never about treatment." },
      { q: "Do you replace my booking system?", a: "No. We link to it from every profile." },
    ],
  },
  {
    slug: "restaurants",
    name: "Restaurants and cafés",
    who: "restaurants, cafés, bakeries and bars",
    term: "restaurant",
    menuWord: "menu",
    serviceArea: false,
    match: /restaurant|cafe|coffee|bakery|bar$|bar_|pub|pizza|meal|ice_cream|dessert|diner|bistro|brunch|tea_house|sandwich|food/,
    hero: {
      title: "Just opened? Get your menu and hours right on Google, Yelp and ChatGPT.",
      sub: "Wrong hours and missing menus cost you tables. We set up every profile to match, find local events to join, and plan your holiday campaigns.",
    },
    pains: [
      { title: "Hours and menus don't match", body: "Google says open, Yelp says closed. We give you one set of details to use everywhere." },
      { title: "Hard to stand out at first", body: "New places get buried under ones with hundreds of reviews. We help you get your first fifty." },
      { title: "Holidays sneak up", body: "Every week you get one ready-to-post campaign tied to the season and what's happening nearby." },
    ],
    kitExtras: ["Menu highlights written for Google and Yelp", "Holiday hours checklist", "Table-tent review QR card"],
    promptTemplates: ["best new {term} in {area}", "where to eat in {area}", "good {term} near {area} for dinner"],
    campaigns: [
      { title: "Holiday party bookings", idea: "Post a simple group menu for December parties with a reservation link." },
      { title: "Neighborhood night", idea: "One weeknight discount for people who live or work nearby." },
      { title: "Night market tasting", idea: "Bring a small tasting menu to a local night market to meet new regulars." },
    ],
    eventKinds: ["night markets", "food festivals", "restaurant weeks", "holiday markets", "charity dinners"],
    servicesPlaceholder: "Wood-fired pizza, house pastas, natural wine. Brunch on weekends.",
    differentPlaceholder: "Chef from Naples, dough made daily, patio with heaters",
    faqs: [
      { q: "Can you update my menu on Google for me?", a: "You stay in control of your profile. We write it, and you paste it in with one tap." },
      { q: "We already use Toast or Square.", a: "Great, keep them. We focus on being found on Google, Apple Maps, Yelp and ChatGPT." },
    ],
  },
];

export const industryBySlug = (slug?: string | null): Industry | undefined =>
  INDUSTRIES.find((i) => i.slug === slug);

/** Guess the industry from Google place types. */
export function guessIndustry(types: string[] = [], primaryType?: string): IndustrySlug | undefined {
  const hay = [primaryType || "", ...types].join(" ").toLowerCase();
  // Order matters: more specific first.
  const order: IndustrySlug[] = ["food-trucks", "pet", "beauty", "home-services", "wellness", "restaurants"];
  for (const slug of order) {
    const ind = INDUSTRIES.find((i) => i.slug === slug)!;
    if (ind.match.test(hay)) return slug;
  }
  return undefined;
}

/** The phrase customers would type, e.g. "nail salon". */
export function searchTerm(industry: Industry, primaryTypeLabel?: string): string {
  if (primaryTypeLabel && primaryTypeLabel.length < 40) return primaryTypeLabel.toLowerCase();
  return industry.term;
}

export function buildPrompts(industry: Industry, term: string, area: string): string[] {
  return industry.promptTemplates.map((t) => t.replaceAll("{term}", term).replaceAll("{area}", area));
}
