import type { IndustrySlug } from "./types";

// Guides target the searches new owners make in their first weeks.
// Each one answers the question directly (good for Google and for AI answers), then offers the free check.

export interface Guide {
  slug: string;
  title: string; // H1 and <title>
  description: string; // meta description, ~150 chars
  keyword: string; // main search phrase
  updated: string; // ISO date
  industry?: IndustrySlug;
  answer: string; // 2-3 sentence direct answer at the top (the part AI tools quote)
  sections: { h: string; p?: string[]; steps?: string[]; bullets?: string[] }[];
  faqs: { q: string; a: string }[];
}

export const GUIDES_CONTENT: Guide[] = [
  {
    slug: "claim-your-business-on-chatgpt",
    title: "How to claim your local business on ChatGPT (Business Hub, 2026)",
    description: "Step-by-step: claim your business profile in ChatGPT's new Business Hub, what verification needs, and what to do if your local business isn't listed yet.",
    keyword: "claim business on chatgpt",
    updated: "2026-11-17",
    answer:
      "Open Business Hub in ChatGPT (chatgpt.com/business-hub), search for your business, and verify it with your business phone, email or website domain. Then finish an identity check. Once approved, you can edit your description, category, website and photos. Brand-new local businesses may need to join a waitlist until their listing appears.",
    sections: [
      {
        h: "What is Businesses in ChatGPT?",
        p: [
          "In November 2026 OpenAI started letting owners claim a business profile inside ChatGPT, much like a Google Business Profile. When someone asks ChatGPT for a local recommendation, it can show businesses with profile details, and owners can see how often they're mentioned.",
          "Claiming doesn't guarantee ChatGPT will recommend you. It makes sure the facts ChatGPT shows about you are right.",
        ],
      },
      {
        h: "How to claim your business, step by step",
        steps: [
          "Sign in to ChatGPT with an account the business will keep. That account manages the profile.",
          "Open Business Hub from the sidebar or go to chatgpt.com/business-hub.",
          "Search for your business and pick the listing with the right address.",
          "Choose a verification method: business phone (text or call), business email, website domain (a DNS record), or Shopify.",
          "Wait for the claim decision by email, then complete the identity check. You may need a photo ID and business registration documents.",
          "Once approved, add your description, category, website, logo and photos.",
        ],
      },
      {
        h: "My business isn't in Business Hub. What now?",
        p: [
          "At launch, only existing US listings could be claimed, and new local profiles went to a waitlist. ChatGPT builds listings from sources across the web, so the fastest way to appear is to be complete and consistent on Google, Bing, Apple Maps and Yelp first.",
          "Bing matters most here, because ChatGPT's search draws on it. Bing Places can import your Google profile in one step.",
        ],
      },
      {
        h: "What actually gets you recommended",
        bullets: [
          "The same name, address and phone on every platform",
          "A complete Google profile with the right primary category",
          "Recent reviews on Google and a Yelp page",
          "Fresh activity, such as weekly Google posts",
          "Being mentioned on local sites, such as event pages, neighborhood guides and local news",
        ],
      },
    ],
    faqs: [
      { q: "Does it cost anything to claim my business on ChatGPT?", a: "No. Claiming a profile was free at launch, and no ads account is needed." },
      { q: "How long does ChatGPT business verification take?", a: "Claim decisions arrive by email, then the identity check runs. Expect a few days, longer during the beta rush." },
      { q: "Can I pay to be recommended by ChatGPT?", a: "No. Recommendations aren't for sale. Complete, consistent listings and real reviews are what help." },
    ],
  },
  {
    slug: "google-business-profile-video-verification",
    title: "Google Business Profile video verification: what to film so it passes",
    description: "A shot list for Google's video verification for storefronts and service-area businesses, plus what to do if your video gets rejected.",
    keyword: "google business profile video verification",
    updated: "2026-11-17",
    answer:
      "Record one continuous, unedited video of a minute or two. Show your location or service area, your business name on signage, a vehicle or documents, the tools or products you work with, and proof that you run the business, such as unlocking the door or showing a business license. The name in the video must match your profile exactly.",
    sections: [
      {
        h: "If you have a storefront",
        steps: [
          "Start outside. Show the street and nearby businesses, then your sign.",
          "Walk inside without stopping the recording.",
          "Show what you sell or do: equipment, products, chairs, kitchen.",
          "Show proof of management: unlock a door or register, or show a business license or utility bill.",
        ],
      },
      {
        h: "If you go to customers (service-area business)",
        steps: [
          "Start with a street sign or landmark in the area you serve.",
          "Show your vehicle with your business name on it. A magnet sign counts.",
          "Show the tools and equipment of your trade.",
          "Show proof of management: business license, invoice or branded uniform.",
        ],
      },
      {
        h: "Why videos get rejected",
        bullets: [
          "Cuts or edits. It must be one continuous take.",
          "No visible business name, or a name that doesn't match the profile",
          "Nothing that proves you manage the business",
          "Too dark or too shaky to see clearly",
          "The profile was edited while verification was pending",
        ],
      },
      {
        h: "If it fails",
        p: [
          "Read the reason Google gives, film again and fix only that part. If you keep failing, ask Google support for another verification method and keep your business documents ready.",
          "After you pass, make your remaining edits in one sitting. Many small edits in a row can trigger a new review.",
        ],
      },
    ],
    faqs: [
      { q: "How long should the verification video be?", a: "Short is fine. One to two minutes, as long as it shows the location or service area, your branding, and proof that you manage the business." },
      { q: "Can I verify without a storefront?", a: "Yes. Service-area businesses film their vehicle, tools and paperwork instead of a shop, and hide their home address on the profile." },
      { q: "How long does Google video verification take?", a: "Often a few days, but reviews can take longer when Google is busy. Don't edit the profile while you wait." },
    ],
  },
  {
    slug: "how-to-get-recommended-by-chatgpt-local-business",
    title: "How to get your local business recommended by ChatGPT, Perplexity and Gemini",
    description: "What AI tools look at when they recommend a local business, and a simple checklist to show up when customers ask 'best ___ near me'.",
    keyword: "how to get my business on chatgpt",
    updated: "2026-11-17",
    answer:
      "AI tools recommend businesses they can confirm from several trusted sources. Be complete and consistent on Google, Bing, Apple Maps, Yelp and Facebook. Earn recent reviews. Post regularly. Get mentioned on local websites. Then check what ChatGPT, Perplexity and Gemini actually say about your area every week.",
    sections: [
      {
        h: "Where AI tools get local answers",
        p: [
          "ChatGPT draws on web search (largely Bing), Gemini uses Google, and Perplexity searches the open web. All three lean on directories and review sites. One large study found Yelp quoted far more often than any other directory, and Google's own pages were the most cited source overall.",
        ],
      },
      {
        h: "The checklist",
        steps: [
          "Claim and complete your Google Business Profile. The primary category is the most important field.",
          "Copy it to Bing Places with the import tool, and add Apple Business Connect.",
          "Create or claim your Yelp and Facebook pages with the exact same name, address and phone.",
          "Claim your ChatGPT business profile if your listing is available.",
          "Get 10 recent Google reviews by asking every happy customer, with a direct link or QR code.",
          "Post on Google every week, even a short update with a photo.",
          "Join or sponsor local events, so neighborhood sites mention you.",
        ],
      },
      { h: "Check your results", p: ["Answers change week to week. Ask each tool the questions your customers ask, like 'best nail salon near Mueller', and see who gets named. Our free check runs these for you in about a minute."] },
    ],
    faqs: [
      { q: "Can a brand-new business show up in ChatGPT?", a: "Yes, but it takes a few weeks of consistent listings and first reviews. Start before or on opening day." },
      { q: "Do I need a website to show up in AI answers?", a: "It helps, but it isn't required. A complete Google profile plus Yelp, Bing and Apple listings covers most of what AI tools read." },
    ],
  },
  {
    slug: "new-business-marketing-checklist",
    title: "New local business marketing checklist: your first 30 days",
    description: "A day-by-day checklist for getting a newly opened local business found on Google, Maps, Yelp and ChatGPT, with no marketing background needed.",
    keyword: "new business marketing checklist",
    updated: "2026-11-17",
    answer:
      "Week one: claim and verify your Google profile, then copy the same details to Apple Maps, Bing, Yelp and Facebook. Week two: get your first 10 reviews with a QR code and a text after each visit. Weeks three and four: post weekly on Google, claim your ChatGPT profile, and show up at one local event.",
    sections: [
      { h: "Week 1: get listed", steps: ["Create or claim your Google Business Profile and start verification.", "Write one set of details (name, address or service area, phone, website, hours) and use it everywhere.", "Add Apple Business Connect, Bing Places (import from Google), Yelp and a Facebook page."] },
      { h: "Week 2: first reviews", steps: ["Get your Google review link and print a QR code for the counter, mirror or truck window.", "Text every happy customer the link the same day.", "Reply to every review within a day."] },
      { h: "Weeks 3 and 4: stay active", steps: ["Post on Google weekly: opening news, a service spotlight, meet the owner, a seasonal offer.", "Claim your ChatGPT business profile.", "Find one local market, fair or drive to join or sponsor.", "Check what AI tools say about your area, and fix whatever's missing."] },
    ],
    faqs: [
      { q: "Should I run ads in my first month?", a: "Not before your free listings are complete. Ads send people to your profiles, so make those good first." },
    ],
  },
  {
    slug: "get-clients-new-cleaning-business",
    industry: "home-services",
    title: "How to get your first clients for a new cleaning business",
    description: "Practical steps to land your first regular cleaning clients: Google profile setup for service-area businesses, reviews, referrals and local events.",
    keyword: "how to get clients for a new cleaning business",
    updated: "2026-11-17",
    answer:
      "Set up a Google Business Profile as a service-area business, so your home address stays hidden. List each service separately. Ask every first client for a Google review the same day, and offer a neighbor referral discount. Most new cleaners get their first regulars from 'near me' searches and word of mouth on the same street.",
    sections: [
      { h: "1. Show up on Google Maps without a storefront", p: ["Choose 'I deliver goods and services to my customers', hide your address and list the towns or neighborhoods you serve. For verification, film your car with a magnet sign, your supplies, and your business license."] },
      { h: "2. List services the way people search", bullets: ["Deep cleaning", "Move-out cleaning", "Recurring weekly or biweekly cleaning", "Airbnb turnover cleaning", "Office cleaning"] },
      { h: "3. Turn every job into the next one", steps: ["Text a review link right after the first clean.", "Leave a thank-you card with a QR code for reviews.", "Offer $20 off for the client and any neighbor they refer on the same street."] },
      { h: "4. Check who AI recommends", p: ["Ask ChatGPT 'best house cleaner in [your town]'. The names it gives are your real competition. Match their categories and reviews, then beat them on freshness."] },
    ],
    faqs: [{ q: "Do I need insurance listed on my profile?", a: "It isn't required, but mentioning that you're insured in your description builds trust with new clients." }],
  },
  {
    slug: "get-clients-new-nail-salon",
    industry: "beauty",
    title: "How to build a clientele for a new nail salon or salon suite",
    description: "Fill your chair faster after opening: Google and Apple Maps setup, booking-link tips, review QR codes for your mirror, and AI visibility.",
    keyword: "how to build clientele for new nail salon",
    updated: "2026-11-17",
    answer:
      "Get your own Google Business Profile, even inside a suite building. Add your booking link to Google, Apple Maps and Instagram. Put a review QR code on your mirror. Post your open slots every week. New clients search 'nail salon near me', and AI tools now answer those searches too, so complete listings matter more than ever.",
    sections: [
      { h: "Salon suite? You can still have your own profile", p: ["If you have your own business name and serve clients there during set hours, you can list your suite. Add your suite number to the address so Google treats you as separate from the building."] },
      { h: "Make booking one tap", bullets: ["Add your Vagaro, Booksy or GlossGenius link as the booking URL on Google", "Use the same link on Apple Maps, Instagram and Facebook", "List each service with a price range"] },
      { h: "Reviews without the awkward ask", steps: ["Put a small QR card on your mirror or station.", "Say: 'I'm new, so a quick Google review would mean the world.'", "Reply to each review by name."] },
    ],
    faqs: [{ q: "Does my booking app count as a Google listing?", a: "No. Booking apps list you in their marketplace, but your own Google profile is what shows up in Maps and AI answers." }],
  },
  {
    slug: "find-food-truck-events-near-me",
    industry: "food-trucks",
    title: "How food trucks and pop-up vendors find events and markets to book",
    description: "Where to find vendor calls, night markets and festivals near you, how to pitch organizers, and how to make sure people can find your truck online.",
    keyword: "food truck events near me vendors",
    updated: "2026-11-17",
    answer:
      "Check city event calendars, local Facebook vendor groups, farmers market applications, breweries and event platforms every week, and apply early because holiday markets fill fast. Send organizers a short pitch with photos, your menu, power needs and insurance. Then post 'where we are this week' on Google and Instagram so customers can follow you.",
    sections: [
      { h: "Where vendor calls are posted", bullets: ["City and county event calendars", "Facebook groups like '[city] vendors wanted' and '[city] food trucks'", "Farmers market and night market applications", "Breweries and wineries looking for weekend food", "Office parks and apartment complexes"] },
      { h: "A pitch organizers say yes to", steps: ["One line on what you serve and why it fits their crowd.", "2 or 3 photos of the truck and food.", "Power and space needs, and your permits and insurance.", "Your phone number and a link to your Google profile with reviews."] },
      { h: "Be findable on the move", p: ["List your truck on Google as a service-area business, post your weekly schedule as a Google update, and keep Yelp and Instagram matching. AI tools answer 'food trucks near me this week' from those sources."] },
    ],
    faqs: [{ q: "Is there one app that lists every vendor event?", a: "No. Calls are scattered across city sites and dozens of groups, which is why we put them in one weekly email." }],
  },
  {
    slug: "get-clients-new-dog-grooming-business",
    industry: "pet",
    title: "How to get clients for a new dog grooming business",
    description: "Facebook groups ban self-promotion. Here's how new groomers get found on Google, Apple Maps and ChatGPT instead, and earn the reviews pet owners trust.",
    keyword: "how to get clients for dog grooming business",
    updated: "2026-11-17",
    answer:
      "Pet owners search 'dog groomer near me' and read reviews closely. Set up Google and Apple Maps first, as a mobile or storefront business. Ask every first client for a review at pickup. Partner with a shelter or dog-friendly brewery for local events. Avoid relying on Facebook groups, which mostly ban promotion.",
    sections: [
      { h: "Set up the right kind of profile", p: ["Mobile groomers list a service area and hide their address. Shops list their address and hours. Either way, choose 'Pet groomer' as your primary category."] },
      { h: "Reviews pet owners trust", steps: ["Ask at pickup, when the dog looks great.", "Text the review link with a photo of their dog.", "Reply warmly and mention the dog's name."] },
      { h: "Local events that work", bullets: ["Shelter adoption days", "Dog-friendly brewery events", "Charity walks", "Pet expos"] },
    ],
    faqs: [{ q: "Can I offer a discount for reviews?", a: "No. Google doesn't allow incentives for reviews. Ask every client instead." }],
  },
  {
    slug: "new-massage-therapy-practice-marketing",
    industry: "wellness",
    title: "Marketing a new massage, chiropractic or wellness practice without an agency",
    description: "A do-it-yourself plan for new wellness practices: Google profile, insurance and booking info, patient-safe review requests, and AI visibility.",
    keyword: "how to market a new massage therapy business",
    updated: "2026-11-17",
    answer:
      "Complete your Google profile with plain-language services, your booking link, and the insurance or HSA options you accept. Copy it to Apple Maps, Bing and Yelp. Ask for reviews in a general way that never references treatment. That covers most of what a monthly agency retainer delivers for a new practice.",
    sections: [
      { h: "What patients check before they call", bullets: ["Services in plain words (deep tissue, prenatal, sports recovery)", "Hours, including evenings and weekends", "Insurance, HSA or FSA", "Recent reviews and photos of the space"] },
      { h: "Patient-safe review requests", p: ["Keep requests general ('How was your visit?') and never mention conditions or treatment in requests or replies."] },
    ],
    faqs: [{ q: "Do I need an agency for local SEO?", a: "Not to start. A complete, consistent set of listings and steady reviews is most of the work, and it's doable in an afternoon." }],
  },
  {
    slug: "new-restaurant-marketing-checklist",
    industry: "restaurants",
    title: "New restaurant marketing: get your menu and hours right everywhere",
    description: "For newly opened restaurants and cafés: one set of hours and menu for Google, Yelp, Apple Maps and ChatGPT, first reviews, and holiday campaigns.",
    keyword: "new restaurant marketing ideas",
    updated: "2026-11-17",
    answer:
      "Make your hours, menu and photos identical on Google, Yelp, Apple Maps and Facebook, because mismatched hours cost tables and confuse AI answers. Add a menu link and reservation link. Put a review QR code on table tents. Post holiday hours early, and show up at one night market or food festival to meet new regulars.",
    sections: [
      { h: "One source of truth", steps: ["Write your hours, holiday hours, menu link and reservation link once.", "Paste them to Google, Yelp, Apple Maps and Facebook.", "Update them all on the same day whenever anything changes."] },
      { h: "First 50 reviews", bullets: ["QR code on table tents and receipts", "Staff mention it at the check", "Reply to every review, especially the critical ones"] },
    ],
    faqs: [{ q: "Should I ask for Yelp reviews?", a: "No. Yelp doesn't allow asking for reviews. Focus your asks on Google and let Yelp grow on its own." }],
  },
];

export const guideBySlug = (slug: string) => GUIDES_CONTENT.find((g) => g.slug === slug);
