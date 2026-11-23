// Comparison pages: MapDebut next to the usual ways a new business gets found.
// Keep every claim about other options checkable (sources listed on each page) and fair:
// each page says plainly when the other option is the better pick.

export interface Comparison {
  slug: string;
  title: string; // H1 and <title>
  description: string; // meta description
  them: string; // short name of the alternative
  answer: string; // the short answer at the top
  rows: { label: string; them: string; us: string }[]; // {kit} in `us` is replaced with today's kit price
  chooseThem: string[];
  chooseUs: string[];
  switching?: { h: string; steps: string[] };
  faqs: { q: string; a: string }[];
  sources: { label: string; href: string }[];
  updated: string;
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "mapdebut-vs-local-seo-agency",
    title: "MapDebut vs. hiring a local SEO agency for a new business",
    description: "What a local SEO agency costs a newly opened business in year one, what you get, and when a one-time launch kit is the better fit.",
    them: "Local SEO agency",
    answer:
      "A local SEO agency typically charges $300 to $500 to set up a Google Business Profile and $125 to $500 a month after that, so year one runs about $1,800 to $6,500. MapDebut writes every profile for you for a one-time {kit}, and you do the pasting yourself in an afternoon. If you want someone else to do all of it, and you have the budget, an agency is the better pick.",
    rows: [
      { label: "Cost to start", them: "$300 to $500 setup", us: "{kit} once" },
      { label: "Year one", them: "$1,800 to $6,500", us: "{kit}, no monthly fee required" },
      { label: "Who does the work", them: "The agency, after an onboarding call", us: "You paste what we wrote, guided step by step" },
      { label: "Platforms covered", them: "Usually Google first, others as add-ons", us: "Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT" },
      { label: "Who owns the profiles", them: "Should be you. Ask, some agencies keep the logins", us: "Always you. We never sign in to your accounts" },
      { label: "Ongoing", them: "Monthly retainer", us: "Optional Weekly Autopilot email, cancel in two clicks" },
      { label: "Money-back", them: "Varies, often a 3 to 12 month contract", us: "14 days, full refund" },
    ],
    chooseThem: [
      "You'd rather pay more than spend an afternoon on setup.",
      "You need ongoing link building, a new website or paid ads managed too.",
      "You run several locations and want one team handling all of them.",
    ],
    chooseUs: [
      "You just opened (or are about to) and want to be findable this week.",
      "You're fine with an afternoon of copy and paste if everything is written for you.",
      "You want to own your profiles and logins from day one.",
    ],
    switching: {
      h: "Already working with an agency? Check these first",
      steps: [
        "Make sure your Google Business Profile lists you as the Primary owner (Business Profile settings, People and access).",
        "Ask for owner access to Yelp, Bing Places, Apple Business Connect and Facebook if they set them up.",
        "Write down the exact business name, address and phone they used, so every new listing matches.",
        "Run the free MapDebut check to see what's still missing before you decide.",
      ],
    },
    faqs: [
      { q: "How much does local SEO cost for a small business?", a: "Typical agency pricing in late 2026 is a $300 to $500 setup fee for a Google Business Profile plus $125 to $500 a month for upkeep. Software tools for tracking start around $40 a month. A one-time launch kit like MapDebut's is cheaper because you do the setup yourself with everything written for you." },
      { q: "Is a local SEO agency worth it for a new business?", a: "It can be, if you have the budget and no time. For most brand-new single-location businesses, the first job is getting complete, consistent profiles on Google, Maps, Yelp and Bing, which you can do yourself in an afternoon with the right copy." },
      { q: "Can I hire an agency later?", a: "Yes. Everything MapDebut writes lives in your own accounts, so an agency can take over any time." },
    ],
    sources: [
      { label: "SlashPost, Google Business Profile optimization cost (Sep 2026)", href: "https://slashpost.ai/blogs/google-business-profile/google-business-profile-optimization-cost" },
    ],
    updated: "2026-11-23",
  },
  {
    slug: "mapdebut-vs-brightlocal",
    title: "MapDebut vs. BrightLocal for a newly opened business",
    description: "BrightLocal is local SEO software for tracking and reports. MapDebut writes a new business's profiles for it. Prices, what each does, and which fits you.",
    them: "BrightLocal",
    answer:
      "BrightLocal is software for tracking local rankings, auditing listings and building reports, starting around $41 a month, with directory submissions charged per site. It's built for marketers and agencies. MapDebut is for an owner who just opened: it writes your Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT profiles for a one-time {kit}. If you manage many locations or clients, BrightLocal is the better tool.",
    rows: [
      { label: "Built for", them: "Marketers, agencies and multi-location brands", us: "Owners of one newly opened business" },
      { label: "Price", them: "From about $41 a month", us: "{kit} once" },
      { label: "Writes your profiles", them: "No, you write everything", us: "Yes: description, services, categories, posts, Q&As" },
      { label: "Directory listings", them: "Paid per site, about $2 to $3.20 each", us: "Step-by-step setup for the 6 that matter most, included" },
      { label: "Rank tracking and reports", them: "Yes, detailed", us: "Free check, then an optional weekly email" },
    ],
    chooseThem: [
      "You manage several locations or clients and need reports.",
      "You want detailed rank tracking across many keywords.",
      "You want listings pushed to dozens of smaller directories.",
    ],
    chooseUs: [
      "You opened recently and nothing is set up yet.",
      "You want the words written for you, not a dashboard to learn.",
      "You'd rather pay once than add another monthly bill.",
    ],
    faqs: [
      { q: "Do I need BrightLocal for a new small business?", a: "Usually not on day one. A new single-location business first needs complete, matching profiles on Google, Apple Maps, Bing, Yelp and Facebook. Tracking tools help more once those exist and you want to measure progress." },
      { q: "Can I use both?", a: "Yes. Use MapDebut to write and set up your profiles, then a tracking tool later if you want detailed reports." },
    ],
    sources: [
      { label: "BrightLocal pricing", href: "https://www.brightlocal.com/pricing/" },
    ],
    updated: "2026-11-23",
  },
  {
    slug: "mapdebut-vs-doing-it-yourself",
    title: "Set up your business listings yourself or use MapDebut?",
    description: "Everything a new business has to set up to be found on Google, Maps and AI assistants, how long it takes on your own, and what MapDebut does for you.",
    them: "Doing it yourself",
    answer:
      "You can set up every listing yourself for free: Google Business Profile, Apple Business Connect, Bing Places, Yelp, Facebook and ChatGPT's Business Hub. Expect several evenings working out what each site wants, writing descriptions, picking categories and keeping your details identical everywhere. MapDebut does the writing and the checklist for a one-time {kit}, so it takes one afternoon. If you enjoy the research and have the time, do it yourself with our free guides.",
    rows: [
      { label: "Cost", them: "$0", us: "{kit} once" },
      { label: "Time", them: "Several evenings", us: "One afternoon" },
      { label: "Writing", them: "You write each profile", us: "Written for you, tap to copy" },
      { label: "Categories and keywords", them: "Trial and error", us: "Picked and explained for your business" },
      { label: "Google verification", them: "Google's help pages", us: "A coach with a shot list that passes" },
      { label: "Matching details everywhere", them: "Keep your own notes", us: "One set of details to paste everywhere" },
    ],
    chooseThem: [
      "Money is tight and you have a few evenings free.",
      "You like learning how Google and Yelp work.",
    ],
    chooseUs: [
      "You'd rather spend those evenings on the business.",
      "You want to get it right the first time, before a suspension or a rejected verification video.",
    ],
    switching: {
      h: "Doing it yourself? The order that works",
      steps: [
        "Decide your exact business name, address (or service area) and phone. Use them identically everywhere.",
        "Create and verify your Google Business Profile first. Don't make big edits right after verifying.",
        "Import Google into Bing Places, then claim Apple Business Connect.",
        "Claim your Yelp page and your Facebook page.",
        "Claim or join the waitlist in ChatGPT's Business Hub.",
        "Ask your first customers for reviews with a direct review link.",
      ],
    },
    faqs: [
      { q: "Can I set up Google Business Profile myself for free?", a: "Yes. Google Business Profile, Apple Business Connect, Bing Places, Yelp and Facebook pages are all free to create. Be careful with your business name and address rules, since mistakes are the most common reason new profiles get suspended." },
      { q: "What's the hardest part to do yourself?", a: "Google verification and getting the details right. Many new owners have a verification video rejected or a profile suspended for keywords in the name. Our free guides and name checker cover both." },
    ],
    sources: [],
    updated: "2026-11-23",
  },
];

export const comparisonBySlug = (slug: string) => COMPARISONS.find((c) => c.slug === slug);
