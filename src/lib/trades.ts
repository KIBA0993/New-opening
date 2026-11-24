// Trade pages: /for/<trade>, one level below the six vertical pages (/for/home-services etc.).
// Owners search for their own trade ("get clients for a new plumbing business"), not our vertical
// names, so each trade gets its own title, H1, pains, FAQ and Product schema. Everything else on
// the page (how it works, kit contents, campaigns, pricing) comes from the parent vertical.
// No city pages yet: add those only once we know where buyers are.
import type { IndustrySlug } from "./types";

export interface Trade {
  slug: string; // URL: /for/<slug>. Must not collide with an IndustrySlug.
  parent: IndustrySlug;
  name: string; // "House cleaning", used in "Launch Kit for new house cleaning businesses"
  noun: string; // "house cleaners", used in eyebrows and lists
  term: string; // the phrase customers search, e.g. "house cleaner"
  category: string; // Google Business Profile primary category to pick
  title: string; // <title>
  description: string; // meta description
  h1: string;
  sub: string;
  pains: { title: string; body: string }[];
  kitExtras: string[];
  faqs: { q: string; a: string }[];
  guides: string[]; // guide slugs that fit this trade, most specific first
  sample: { q: string; picks: string[]; you: string }; // fictional businesses, Austin
}

export const TRADES: Trade[] = [
  {
    slug: "house-cleaning",
    parent: "home-services",
    name: "House cleaning",
    noun: "house cleaners and maid services",
    term: "house cleaner",
    category: "House cleaning service",
    title: "Get clients for a new house cleaning business: Google Maps and ChatGPT setup",
    description:
      "For new house cleaners and maid services: get on Google Maps without showing your home address, pass video verification, and see whether ChatGPT recommends you or the big franchises.",
    h1: "Get your new cleaning business found by the people searching “house cleaner near me”.",
    sub: "Most cleaners start from home with no storefront. We set you up as a service-area business, coach you through Google's video check, and write every profile so AI assistants can recommend you.",
    pains: [
      { title: "No storefront to verify", body: "Google asks home-based cleaners to film their car, supplies and paperwork. We give you a shot list that passes the first time." },
      { title: "Franchises take every AI answer", body: "Ask ChatGPT for the best house cleaner in your town. It usually names the chains with hundreds of reviews. We show you what they have that you don't yet." },
      { title: "Recurring clients come from one street", body: "One happy client tells the neighbors. Your kit includes a neighbor referral card and a review QR code to leave after every clean." },
    ],
    kitExtras: ["Services written the way clients search (deep, move-out, recurring, Airbnb turnover)", "Service-area setup that keeps your home address private", "Leave-behind card with your review QR code"],
    faqs: [
      { q: "Which Google category should a new cleaning business pick?", a: "Pick “House cleaning service” as your primary category. Add “Janitorial service” or “Commercial cleaning service” only if you really do offices, because Google matches searches to categories first." },
      { q: "Can I list my cleaning business on Google if I work from home?", a: "Yes. Choose that you visit customers, hide your address, and list the towns or neighborhoods you serve. Never use a P.O. box or virtual office, which gets profiles suspended." },
      { q: "How do new cleaners get their first Google reviews?", a: "Text your review link the same day as the first clean, while the house still looks great. Google doesn't allow discounts in exchange for reviews, so ask every client instead." },
      { q: "Should I say I'm insured and bonded?", a: "Yes, if you are. Put it in your Google description, website and Yelp. AI assistants answer “insured house cleaner near me” with businesses that say so plainly." },
    ],
    guides: ["get-clients-new-cleaning-business", "service-area-business-hide-address", "google-business-profile-video-verification"],
    sample: { q: "best house cleaner in Austin for a deep clean", picks: ["Sparkle & Shine Cleaning", "Lone Star Maids", "TidyNest Co."], you: "Your cleaning business" },
  },
  {
    slug: "plumber",
    parent: "home-services",
    name: "Plumbing",
    noun: "plumbers",
    term: "plumber",
    category: "Plumber",
    title: "New plumbing business? Get found on Google Maps and in ChatGPT answers",
    description:
      "For plumbers starting out on their own: set up a service-area Google profile, show your license, pass verification, and see which plumbers AI assistants recommend instead of you.",
    h1: "Get your new plumbing business called first, on Google Maps and in AI answers.",
    sub: "When a pipe bursts, people call whoever Google or ChatGPT names. We write your profiles with your license, service area and emergency hours, and show you who gets named instead of you.",
    pains: [
      { title: "Emergency calls go to the top three", body: "“Plumber near me” is decided in seconds. With a new profile and no reviews you're invisible. We show you the fastest way into that list." },
      { title: "Lead sites want a cut of every job", body: "Pay-per-lead services sell the same lead to several plumbers. Your own Google, Apple Maps and Yelp profiles bring calls straight to you, for free." },
      { title: "Verification without an office", body: "Most plumbers run from home and a van. Our verification coach tells you what to film: the van, tools, license and a job in progress." },
    ],
    kitExtras: ["License number and insurance written into every profile", "Separate service pages (drains, water heaters, repiping, leak repair)", "Van and tools video shot list for verification"],
    faqs: [
      { q: "Which Google category should a plumber pick?", a: "“Plumber” as the primary category. Add specific ones you really offer, such as “Drainage service” or “Water heater installation service”, as secondary categories." },
      { q: "Should a new plumber list 24-hour hours?", a: "Only if you truly answer the phone around the clock. Google and customers both punish listings whose hours are wrong. If you take emergency calls on some nights, say that in your description instead." },
      { q: "Do I need to show my plumbing license?", a: "Most states require a license, and customers and AI assistants both look for it. Put the license number in your Google description, on your website and on Yelp." },
      { q: "Are Google Local Services Ads worth it for a new plumber?", a: "They can be, once your free profile is complete and has a few reviews. Plumbing is an eligible category, and the badge needs background and license checks. Start with the free profile: it's what the ads and AI answers build on." },
    ],
    guides: ["service-area-business-hide-address", "google-business-profile-video-verification", "get-first-google-reviews-new-business"],
    sample: { q: "plumber in Austin who can come today for a leak", picks: ["Hill Country Home Care", "Eastside Handy Pros", "Bluebonnet Plumbing Co."], you: "Your plumbing business" },
  },
  {
    slug: "hvac",
    parent: "home-services",
    name: "HVAC",
    noun: "HVAC and heating contractors",
    term: "HVAC company",
    category: "HVAC contractor",
    title: "New HVAC company? Get found on Google Maps and recommended by ChatGPT",
    description:
      "For new heating and air conditioning businesses: Google profile setup with the right categories, seasonal posts, license details, and a check of which HVAC companies AI assistants name.",
    h1: "Get your new HVAC business found before the first cold snap.",
    sub: "Heating and AC calls spike with the weather, and owners call whoever shows up first. We write your profiles with the right categories and service area, and show you who AI recommends instead of you.",
    pains: [
      { title: "Demand comes in waves", body: "The first freeze and the first heat wave bring a flood of “AC repair near me” and “furnace repair” searches. Your profile has to be ready before then." },
      { title: "Big brands own the answers", body: "Established companies have years of reviews. We find the questions where a new company can still be named, such as a specific town or a specific system." },
      { title: "Too many categories, picked wrong", body: "HVAC contractor, air conditioning repair, furnace repair: picking the wrong primary category hides you from the searches that pay." },
    ],
    kitExtras: ["Category plan: primary and secondary categories for heating and cooling", "Seasonal Google posts for tune-ups before winter and summer", "License, insurance and brands-serviced lines for every profile"],
    faqs: [
      { q: "Which Google category should a new HVAC company pick?", a: "“HVAC contractor” is the usual primary category. Add “Air conditioning repair service”, “Furnace repair service” or “Heating contractor” as secondary categories for the work you really do." },
      { q: "Should I list the equipment brands I service?", a: "Yes, in your description and services. People search “Carrier repair near me” or “heat pump installer”, and AI assistants pick businesses that name the system plainly." },
      { q: "When should a new HVAC business post on Google?", a: "Before each season: tune-up reminders in early fall and early spring, and a short post whenever the weather turns. Weekly posts show Google and customers that you're active." },
      { q: "Does a new HVAC company need a website?", a: "Not to get on Google Maps, but a simple site with one page per service (AC repair, furnace repair, installs) helps AI assistants recommend you. Your kit writes those pages." },
    ],
    guides: ["google-business-profile-categories", "service-area-business-hide-address", "how-to-get-recommended-by-chatgpt-local-business"],
    sample: { q: "best HVAC company in Austin for AC repair", picks: ["Lone Star Air", "Hill Country Home Care", "Bluebonnet Heating & Air"], you: "Your HVAC company" },
  },
  {
    slug: "landscaping",
    parent: "home-services",
    name: "Landscaping and lawn care",
    noun: "landscapers and lawn care crews",
    term: "landscaper",
    category: "Landscaper",
    title: "Get clients for a new landscaping or lawn care business on Google and ChatGPT",
    description:
      "For new landscapers and lawn care crews: set up a service-area Google profile, show your work with before-and-after photos, and see which landscapers AI assistants recommend in your town.",
    h1: "Get your new landscaping business on every “lawn care near me” list.",
    sub: "Homeowners pick a landscaper from photos and reviews. We write your profiles, plan the photos that sell, and show you who AI assistants recommend in your town instead of you.",
    pains: [
      { title: "Your best work happens at other people's houses", body: "No storefront, no sign out front. Before-and-after photos on Google are your shop window. Your kit tells you which shots to take." },
      { title: "Seasonal swings", body: "Spring cleanups, summer mowing, fall leaves. A post plan for each season keeps your profile active when people are choosing a crew." },
      { title: "Routes depend on neighbors", body: "Five clients on one street beat five across town. Your kit includes a neighbor offer and a yard sign plan with your review QR code." },
    ],
    kitExtras: ["Before-and-after photo shot list", "Seasonal post plan (spring cleanup, mowing, leaves, snow)", "Yard sign and door hanger copy with your review QR code"],
    faqs: [
      { q: "Which Google category should a landscaping business pick?", a: "“Landscaper” if you design and install, or “Lawn care service” if you mostly mow and maintain. Add the other as a secondary category if you do both." },
      { q: "Can I put a yard sign at a client's house?", a: "With their permission, yes, and it's one of the best ways to get the neighbors calling. Check your town and HOA rules first, since some limit signs." },
      { q: "How should a new landscaper list a service area?", a: "Hide your address and list the towns or zip codes you really drive to. A tight area you serve well beats a huge one you can't." },
      { q: "Do photos really matter on Google?", a: "Yes. For landscaping, photos are often what gets the call. Add a few new ones every month, with real before-and-after pairs from your own jobs." },
    ],
    guides: ["service-area-business-hide-address", "get-first-google-reviews-new-business", "new-business-marketing-checklist"],
    sample: { q: "best lawn care service in Austin", picks: ["Hill Country Home Care", "Green Acre Lawn Co.", "Bluebonnet Yard Works"], you: "Your landscaping business" },
  },
  {
    slug: "nail-salon",
    parent: "beauty",
    name: "Nail salon",
    noun: "nail salons and nail techs",
    term: "nail salon",
    category: "Nail salon",
    title: "New nail salon? Fill your chairs from Google Maps and ChatGPT",
    description:
      "For new nail salons and nail techs: Google and Apple Maps profiles that work with your booking app, a review QR card for your station, and a check of which salons AI assistants recommend.",
    h1: "Fill your new nail salon from “nail salon near me”.",
    sub: "New clients search, compare photos and book the same day. We write your profiles, connect them to your booking link, and show you which salons AI assistants recommend instead of yours.",
    pains: [
      { title: "Photos decide the booking", body: "Clients scroll your nail photos before they read anything. Your kit has a photo plan and the captions that help Google match them to searches." },
      { title: "Your booking app isn't your listing", body: "Booksy, Vagaro and GlossGenius list you in their own apps. Google, Apple Maps and AI assistants are where new clients start." },
      { title: "Walk-ins need accurate hours", body: "“Nail salon open now” only shows salons with correct hours. We make sure they match everywhere, including holidays." },
    ],
    kitExtras: ["Service menu with prices written for Google (gel, acrylic, dip, pedicure)", "Booking link set up on every profile", "Station QR card for reviews"],
    faqs: [
      { q: "Which Google category should a nail salon pick?", a: "“Nail salon” as primary. If you also do lashes or waxing, add those as secondary categories only if they're a real part of your menu." },
      { q: "Can I add my booking link to Google?", a: "Yes. Add it as your appointment link on your Google profile, and use the same link on Apple Maps, Instagram and Facebook so clients can book in one tap." },
      { q: "Should I list prices on Google?", a: "Yes, at least a starting price per service. People compare salons on price, and AI assistants use listed prices to answer “affordable nail salon near me”." },
      { q: "I rent a suite inside a salon building. Can I have my own profile?", a: "Yes, if you have your own business name and serve clients there during set hours. Add your suite number to the address so you aren't merged with the building." },
    ],
    guides: ["get-clients-new-nail-salon", "salon-suite-google-business-profile", "get-first-google-reviews-new-business"],
    sample: { q: "best nail salon near South Congress for gel manicures", picks: ["Polished Nail Lounge", "The Gilded Tip", "Bloom Nail Bar"], you: "Your salon" },
  },
  {
    slug: "hair-salon",
    parent: "beauty",
    name: "Hair salon",
    noun: "hair salons and stylists in salon suites",
    term: "hair salon",
    category: "Hair salon",
    title: "New hair salon or salon suite? Get found on Google Maps and in AI answers",
    description:
      "For new hair salons and stylists in suites: get your own Google profile inside a shared building, add your booking link, and see which salons ChatGPT recommends near you.",
    h1: "Build a new clientele for your hair salon or suite, from Google and AI.",
    sub: "Your regulars followed you. New clients ask Google and ChatGPT for a stylist who does exactly what they want. We write your profiles around your specialties and show you who gets named instead.",
    pains: [
      { title: "Lost inside the building", body: "Salon suite buildings often have one Google listing for everyone. We show you how to get your own profile, with your suite number, that shows up on its own." },
      { title: "Specialties get you found", body: "“Curly hair specialist” and “balayage near me” are searches a new stylist can win. Generic “hair salon” rarely is. Your kit writes your profile around what you're known for." },
      { title: "Rebooking is the business", body: "New clients are expensive to find. Your weekly email reminds you to post open slots and ask for reviews while the color is fresh." },
    ],
    kitExtras: ["Specialty services written the way clients search (balayage, curly cuts, extensions)", "Suite address setup so you aren't merged with the building", "Mirror QR card for reviews"],
    faqs: [
      { q: "Which Google category should a hair salon pick?", a: "“Hair salon” as primary. Add “Hair extension technician”, “Hair color specialist” or “Beauty salon” as secondary categories only for work you really offer." },
      { q: "Can a stylist in a salon suite have their own Google profile?", a: "Yes, if you have your own business name and serve clients at your suite during set hours. Use your suite number in the address and your own phone number." },
      { q: "Should I list my specialties on Google?", a: "Yes. List each specialty as its own service with a short description. AI assistants answer “best balayage in [town]” from those details." },
      { q: "My booking app already shows reviews. Do I need Google reviews too?", a: "Yes. Reviews inside a booking app stay in that app. Google reviews show up in Maps and are one of the sources AI assistants read." },
    ],
    guides: ["salon-suite-google-business-profile", "get-clients-new-nail-salon", "google-business-profile-categories"],
    sample: { q: "hair salon in Austin that specializes in curly hair", picks: ["Velvet Hair Studio", "Luxe Lash & Hair", "South Congress Salon"], you: "Your salon" },
  },
  {
    slug: "barbershop",
    parent: "beauty",
    name: "Barbershop",
    noun: "barbershops and independent barbers",
    term: "barber shop",
    category: "Barber shop",
    title: "New barbershop? Get found on Google Maps and recommended by ChatGPT",
    description:
      "For new barbershops and barbers going independent: accurate walk-in hours, a Google profile with your cuts and prices, review QR codes for your chair, and an AI visibility check.",
    h1: "Get your new barbershop on every “barber near me” search.",
    sub: "Guys search, check the photos and walk in. We write your profiles with your cuts, prices and walk-in hours, and show you which shops AI assistants recommend instead of yours.",
    pains: [
      { title: "Walk-ins depend on “open now”", body: "If your hours are wrong on one map, you lose the walk-in. We set them the same on Google, Apple Maps, Bing and Yelp." },
      { title: "Your cuts don't show up in search", body: "Fades, beard trims, kids' cuts, hot towel shaves. Listed one by one, each is a search you can show up for." },
      { title: "Going independent from a busy shop", body: "Your clients know you, but Google doesn't yet. A new profile with a few honest reviews from regulars gets you started." },
    ],
    kitExtras: ["Cut and service list with prices, written for Google", "Walk-in and appointment hours set the same everywhere", "Chair QR card for reviews"],
    faqs: [
      { q: "Which Google category should a barbershop pick?", a: "“Barber shop” as primary. Add “Hair salon” only if you really cut all hair types and lengths, since the two serve different searches." },
      { q: "Should I show walk-in hours on Google?", a: "Yes. Keep your regular hours exact and add special hours for holidays. If you take walk-ins, say so in your description; people search “barber walk-in near me”." },
      { q: "Can my regulars leave Google reviews for my new shop?", a: "Yes, as long as they're real customers writing honestly, with no discount or freebie in exchange. Ask them after their next cut." },
      { q: "Is Instagram enough for a barbershop?", a: "It's great for showing cuts, but new customers searching Google Maps or asking ChatGPT won't find you there. Link your Instagram from your Google profile." },
    ],
    guides: ["get-first-google-reviews-new-business", "business-not-showing-on-google-maps", "why-isnt-my-business-on-chatgpt"],
    sample: { q: "best barber in East Austin for a skin fade", picks: ["Eastside Cuts", "The Dapper Chair", "Cesar Chavez Barber Co."], you: "Your shop" },
  },
  {
    slug: "dog-grooming",
    parent: "pet",
    name: "Dog grooming",
    noun: "dog groomers, mobile and in-shop",
    term: "dog groomer",
    category: "Pet groomer",
    title: "Get clients for a new dog grooming business: Google Maps and ChatGPT",
    description:
      "For new dog groomers, mobile or in a shop: the right Google profile type, reviews pet owners trust, local pet events, and a check of which groomers AI assistants recommend.",
    h1: "Get your new grooming business booked by dog owners searching nearby.",
    sub: "Pet owners read every review before they hand over their dog. We write your profiles, set up mobile or storefront the right way, and show you which groomers AI assistants recommend instead of you.",
    pains: [
      { title: "Facebook groups ban promotion", body: "Most local pet groups delete business posts. Google, Apple Maps and AI answers are where owners look instead." },
      { title: "Trust comes before the first booking", body: "Owners want to see happy dogs, clean tables and real reviews. Your kit has a photo plan and a pickup-time review request." },
      { title: "Mobile groomers get set up wrong", body: "A van isn't a storefront. We set you up as a service-area business so you show up across your route, not at your home address." },
    ],
    kitExtras: ["Mobile or storefront setup, done the right way for each", "Breed and service list (bath and brush, full groom, de-shedding, nail trims)", "Pickup-time review text with a photo of the dog"],
    faqs: [
      { q: "Which Google category should a dog groomer pick?", a: "“Pet groomer” as primary. Add “Dog day care center” or “Pet sitter” only if you really offer them." },
      { q: "Can a mobile dog groomer be on Google Maps?", a: "Yes. Choose that you visit customers, hide your home address and list the areas on your route. You'll show up for searches there without a storefront." },
      { q: "When should I ask for a review?", a: "At pickup, when the dog looks its best. Text the review link with a photo of their dog. Don't offer a discount for it; Google doesn't allow review incentives." },
      { q: "What local events help a new groomer?", a: "Shelter adoption days, charity walks, dog-friendly brewery events and pet expos. Your weekly email lists the ones near you with a short pitch written." },
    ],
    guides: ["get-clients-new-dog-grooming-business", "service-area-business-hide-address", "get-first-google-reviews-new-business"],
    sample: { q: "dog groomer near Mueller with good reviews", picks: ["Wag & Wash Grooming", "Barkside Pet Spa", "The Dapper Dog"], you: "Your grooming business" },
  },
  {
    slug: "massage-therapist",
    parent: "wellness",
    name: "Massage therapy",
    noun: "massage therapists and studios",
    term: "massage therapist",
    category: "Massage therapist",
    title: "New massage therapy practice? Get found on Google Maps and in ChatGPT",
    description:
      "For new massage therapists and studios: plain-language services, booking and HSA details, client-safe review requests, and a check of which practices AI assistants recommend.",
    h1: "Get your new massage practice found by clients searching nearby.",
    sub: "Clients choose a therapist from services, hours and reviews. We write your profiles in plain words, add your booking link, and show you which practices AI recommends instead of yours.",
    pains: [
      { title: "Spas and chains dominate", body: "Big spa brands have thousands of reviews. Specific searches like “prenatal massage” or “sports massage near me” are where a new therapist can win." },
      { title: "Reviews have to be handled carefully", body: "Clients share personal details. Your kit has review requests and replies that never mention anyone's condition or treatment." },
      { title: "Evening and weekend hours matter", body: "Most clients book after work. If your hours are wrong on one map, you lose them." },
    ],
    kitExtras: ["Services in plain words (deep tissue, prenatal, sports recovery, couples)", "License number and HSA/FSA line for every profile", "Client-safe review request and reply templates"],
    faqs: [
      { q: "Which Google category should a massage therapist pick?", a: "“Massage therapist” as primary. A studio can use “Massage spa”. Add “Sports massage therapist” or similar secondary categories only for work you really do." },
      { q: "Should I show my massage license number?", a: "Yes, in your description and on your website. Most states require a license, and clients and AI assistants both look for it." },
      { q: "How do I reply to reviews without breaking client privacy?", a: "Thank the person and talk about the visit in general terms. Never confirm what they were treated for, even if they mentioned it." },
      { q: "Can clients pay with an HSA or FSA?", a: "Sometimes, often with a doctor's note. If you accept them, say so on every profile. People ask AI assistants for therapists who do." },
    ],
    guides: ["new-massage-therapy-practice-marketing", "get-first-google-reviews-new-business", "fake-or-unfair-google-review"],
    sample: { q: "best massage therapist in Austin for sports recovery", picks: ["Restore Massage Studio", "Still Water Spa", "Greenleaf Wellness"], you: "Your practice" },
  },
  {
    slug: "chiropractor",
    parent: "wellness",
    name: "Chiropractic",
    noun: "chiropractors and chiropractic practices",
    term: "chiropractor",
    category: "Chiropractor",
    title: "New chiropractic practice? Get found on Google Maps and recommended by ChatGPT",
    description:
      "For chiropractors opening their own practice: insurance and booking details on every profile, patient-safe review replies, and a check of which practices AI assistants recommend.",
    h1: "Get your new chiropractic practice found by patients nearby.",
    sub: "Patients check insurance, hours and reviews before they call. We write your profiles with all three, and show you which practices AI assistants recommend instead of yours.",
    pains: [
      { title: "“Do you take my insurance?”", body: "It's the first question patients ask, and AI assistants try to answer it. If your profiles don't say, you're skipped." },
      { title: "Review replies carry privacy risk", body: "Confirming someone is a patient in a public reply can break patient privacy rules. Your kit has reply templates that stay general." },
      { title: "Established practices have years of reviews", body: "Specific searches (“sports chiropractor”, “prenatal chiropractor”, “walk-in chiropractor”) are where a new practice shows up first." },
    ],
    kitExtras: ["Insurance, HSA and new-patient details written for every profile", "Patient-safe review requests and replies", "Service pages for specific care (sports, prenatal, auto injury)"],
    faqs: [
      { q: "Which Google category should a chiropractor pick?", a: "“Chiropractor” as primary. Add secondary categories only for services you really provide, and keep the business name exactly as it appears on your signage." },
      { q: "How should a chiropractor reply to Google reviews?", a: "Keep it general: thank them and invite them to call the office. Don't confirm they're a patient or mention any treatment, even in reply to a bad review." },
      { q: "Should I list the insurance plans I accept?", a: "Yes, on your website and in your Google description, and keep it current. Patients and AI assistants both look for it." },
      { q: "Can I ask patients for reviews?", a: "Yes, ask in a general way (“How was your visit?”) and never offer anything in return. Don't ask staff or family to post reviews." },
    ],
    guides: ["new-massage-therapy-practice-marketing", "fake-or-unfair-google-review", "google-business-profile-before-opening"],
    sample: { q: "chiropractor in Austin that takes my insurance", picks: ["Align Chiropractic", "Core Balance PT", "Elm Street Therapy"], you: "Your practice" },
  },
  {
    slug: "coffee-shop",
    parent: "restaurants",
    name: "Coffee shop",
    noun: "coffee shops and cafés",
    term: "coffee shop",
    category: "Coffee shop",
    title: "Opening a coffee shop? Get on Google Maps, Apple Maps and ChatGPT before day one",
    description:
      "For new coffee shops and cafés: set up Google before opening, get hours, menu and Wi-Fi details right everywhere, and see which cafés AI assistants recommend near you.",
    h1: "Get your new coffee shop on the map before the doors open.",
    sub: "People pick a café from Maps on the way somewhere. We set up your profiles before opening day, get hours and menu right everywhere, and show you which cafés AI recommends instead of yours.",
    pains: [
      { title: "Invisible on opening day", body: "Google can take days or weeks to verify. You can create your profile before you open, so it's ready when the doors are." },
      { title: "Details people filter by", body: "Wi-Fi, outlets, oat milk, outdoor seating, dog friendly. AI assistants answer “cafés to work from near me” from exactly these details." },
      { title: "Hours change all the time at first", body: "Soft opening, then new hours, then holiday hours. Wrong hours on one map send people to a locked door." },
    ],
    kitExtras: ["Pre-opening Google profile setup", "Menu and attributes (Wi-Fi, seating, dietary options) written for every map", "Hours plan for the soft opening, grand opening and holidays"],
    faqs: [
      { q: "Can I put my coffee shop on Google before it opens?", a: "Yes. Google lets you add an opening date up to 90 days ahead. Your profile shows “Opening soon” until then, so people can find you before day one." },
      { q: "Which Google category should a coffee shop pick?", a: "“Coffee shop” as primary. Add “Café”, “Bakery” or “Breakfast restaurant” only if they describe what you really serve." },
      { q: "Should I list Wi-Fi and seating on Google?", a: "Yes. Set the attributes on Google and say it in your description. People ask AI assistants for cafés to work from, and those details decide who gets named." },
      { q: "Do I need Apple Maps too?", a: "Yes. iPhone users on foot or in the car often search Apple Maps first. Apple Business Connect is free and takes about ten minutes." },
    ],
    guides: ["google-business-profile-before-opening", "new-restaurant-marketing-checklist", "apple-maps-business-connect-new-business"],
    sample: { q: "best coffee shop in East Austin to work from", picks: ["Little Fig Café", "The Corner Bakehouse", "Juniper Kitchen"], you: "Your coffee shop" },
  },
];

export const tradeBySlug = (slug: string) => TRADES.find((t) => t.slug === slug);
export const tradesFor = (parent: IndustrySlug) => TRADES.filter((t) => t.parent === parent);
