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
  related?: string[]; // slugs to link under "Keep reading", most useful first
  topic?: "google" | "reviews" | "ai" | "listings" | "customers"; // groups the /questions hub
}

export const GUIDES_CONTENT: Guide[] = [
  {
    slug: "claim-your-business-on-chatgpt",
    topic: "ai",
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
          "Yelp and Bing matter most here. ChatGPT uses licensed data from Yelp and TripAdvisor plus several search providers, Bing among them. Bing Places can import your Google profile in one step.",
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
    topic: "google",
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
    topic: "ai",
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
          "ChatGPT draws on several search providers (Bing among them) plus licensed data from Yelp and TripAdvisor, Gemini uses Google, and Perplexity searches the open web. All three lean on directories and review sites. One large study found Yelp quoted far more often than any other directory, and Google's own pages were the most cited source overall.",
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
      { q: "Do I need a website to show up in AI answers?", a: "It isn't required, but it helps a lot. Business websites are the source AI assistants cite most for local answers, so a few pages listing your services, prices and towns make a real difference." },
    ],
  },
  {
    slug: "new-business-marketing-checklist",
    topic: "customers",
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
    topic: "customers",
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
    topic: "customers",
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
    topic: "customers",
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
    topic: "customers",
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
    topic: "customers",
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
    topic: "customers",
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

  // Owner questions (Nov 2026): the problems new owners post most on r/GoogleMyBusiness, r/smallbusiness,
  // the Local Search Forum and Google's own help community, answered directly.
  {
    slug: "business-not-showing-on-google-maps",
    topic: "google",
    title: "Why isn't my new business showing up on Google Maps? (and how long it takes)",
    description: "Verified but invisible? The 7 reasons a new Google Business Profile doesn't show on Maps, how long it normally takes, and what to fix first.",
    keyword: "why is my business not showing up on google maps",
    updated: "2026-11-18",
    answer:
      "A new profile usually appears on Google Maps within a few days of verification, but it won't rank for searches like 'plumber near me' for weeks. If you can't find it even by searching your exact business name, it's usually one of three things: verification isn't finished, a recent edit is still under review, or the profile was quietly suspended. Search your exact name first, then check the status in your Business Profile dashboard.",
    sections: [
      {
        h: "First, which kind of 'not showing' is it?",
        bullets: [
          "Not found even for your exact name: a verification, review or suspension problem. Fix this first.",
          "Found by name, but not for 'nail salon near me': a ranking problem. Normal for new businesses, and it improves with reviews, categories and time.",
          "Showing on Google, but not on Apple Maps or in ChatGPT: those don't copy Google. You have to list yourself there separately.",
        ],
      },
      {
        h: "The 7 most common reasons",
        steps: [
          "Verification isn't complete. 'Pending' or 'Verify now' in your dashboard means Google hasn't published you yet.",
          "A recent edit is under review. Changing your name, address or category right after verifying can put the profile back into review for several days.",
          "The profile was suspended. Your dashboard shows a red banner or 'Suspended'. See our suspension guide.",
          "You're a service-area business. With a hidden address, you only appear to people searching inside the areas you listed.",
          "Your primary category doesn't match the search. 'Beauty salon' won't show for 'nail salon near me'. Pick the most specific category.",
          "You're new and have no reviews. Google ranks proven businesses higher. Most new listings need 5 to 10 reviews before they show for broad searches.",
          "Searcher distance. Maps favors businesses closest to the person searching, so you won't appear for someone across town yet.",
        ],
      },
      {
        h: "How long does it take?",
        p: [
          "After you finish verification, most profiles appear for their exact name within a few days. Showing up for a general search like 'dog groomer near me' in your neighborhood takes longer, often four to twelve weeks, and depends far more on your category, reviews and distance than on time alone.",
          "Edits to your name, address, hours or category are reviewed separately and can take up to a few days to go live.",
        ],
      },
      {
        h: "What to do this week",
        steps: [
          "Search your exact business name on Google Maps, logged out or in a private window.",
          "Open business.google.com and read the status at the top of your profile.",
          "Set the most specific primary category, and add two or three secondary ones.",
          "Ask your first five happy customers for a review today.",
          "Run a free check to see who Google and AI assistants show for your area instead of you.",
        ],
      },
    ],
    faqs: [
      { q: "How long does it take for a new business to show up on Google Maps?", a: "Usually a few days after verification for your exact name. Showing up for general 'near me' searches often takes four to twelve weeks and depends on reviews, category and distance." },
      { q: "My Google Business Profile is verified. Why can't I find it?", a: "Search your exact name in a private window. If it's still missing, check your dashboard for an edit under review or a suspension notice. Edits made right after verifying are the most common cause." },
      { q: "Does paying for Google Ads make my listing show up?", a: "No. Ads appear in a separate labeled slot. Your free listing ranks on relevance, distance and prominence, which you can't buy." },
      { q: "Why do I show up on my phone but not for my customers?", a: "Google personalizes results by location. You're standing next to your business. Check from a customer's area, or use a grid check like ours." },
    ],
    related: ["google-business-profile-suspended-new-business", "google-business-profile-before-opening", "service-area-business-hide-address"],
  },
  {
    slug: "google-business-profile-before-opening",
    topic: "google",
    title: "Can I create a Google Business Profile before I open? Yes, here's how",
    description: "Google lets you list a business up to 90 days before opening day. How to set the opening date, verify early, and be findable the day you open.",
    keyword: "google business profile before opening",
    updated: "2026-11-18",
    answer:
      "Yes. Google lets you set a future opening date up to 90 days ahead, and your profile shows 'Opening soon' with that date until then. Create the profile, add the opening date under 'Opening date' in your profile info, and start verification right away, because verification can take days or weeks. On opening day, the profile switches to open automatically.",
    sections: [
      {
        h: "Why start early",
        p: [
          "Verification is the slowest step, especially video verification for new storefronts and service-area businesses. Starting before you open means you're on Maps the day your doors open, not two weeks later.",
          "An 'Opening soon' profile also lets neighbors find you, follow you on Maps and see your photos before day one.",
        ],
      },
      {
        h: "Step by step",
        steps: [
          "Go to business.google.com and add your business with the exact name on your sign and paperwork.",
          "Pick the most specific primary category, like 'Pet groomer' rather than 'Pet store'.",
          "Enter your address, or choose the service-area option if customers don't come to you.",
          "Open 'Edit profile', then 'About' or 'Business information', and set the opening date (up to 90 days away).",
          "Start verification. For video, film your sign or vehicle, your tools or stock, and proof you're the owner.",
          "Add your logo, a cover photo, and your services. Leave hours until you know them, then add them before opening day.",
        ],
      },
      {
        h: "Do the same on the other maps",
        bullets: [
          "Apple Business Connect: free, and the source for Apple Maps and Siri.",
          "Bing Places: import your Google profile in one step. Bing feeds Copilot and is one of the sources ChatGPT searches.",
          "Yelp: create the page now so AI assistants find it. Don't ask for Yelp reviews.",
          "Facebook: one page with the same name, address and phone.",
        ],
      },
    ],
    faqs: [
      { q: "How far in advance can I create a Google Business Profile?", a: "You can set an opening date up to 90 days in the future. Your profile shows 'Opening soon' until that date." },
      { q: "Can I verify a business that isn't open yet?", a: "Usually yes, as long as you can show it's real: signage, a vehicle, stock or equipment, and business paperwork. Your storefront needs to be staffed or set up enough to film." },
      { q: "What if my opening date changes?", a: "Edit the opening date in your profile. Keep it accurate, because a date that keeps passing looks like a closed business." },
    ],
    related: ["google-business-profile-video-verification", "new-business-marketing-checklist", "business-not-showing-on-google-maps"],
  },
  {
    slug: "google-business-profile-suspended-new-business",
    topic: "google",
    title: "Google Business Profile suspended right after opening? Why it happens and how to get reinstated",
    description: "New profiles get suspended more than any other. The common triggers, what evidence to gather, and how to appeal without making it worse.",
    keyword: "google business profile suspended",
    updated: "2026-11-18",
    answer:
      "New profiles are suspended most often for a business name with extra keywords, a virtual office or shared address, a home address shown on a service-area business, or big edits made right after verifying. Don't create a new profile. Fix the cause, gather proof (business license, utility bill or lease, photos of your signage), and file one appeal through Google's Business Profile appeals tool.",
    sections: [
      {
        h: "The usual triggers for new businesses",
        bullets: [
          "Keywords in the name: 'Bright Smiles Cleaning Austin Best Maid Service' instead of 'Bright Smiles Cleaning'",
          "A virtual office, coworking desk, PO box or UPS box as the address",
          "Showing a home address for a business customers don't visit",
          "Changing name, address or category right after verification",
          "Two profiles for the same business, often one created by mistake, or the same phone number on several profiles",
          "Hours that say open 24 hours when nobody is there",
          "A website that doesn't match the name or address on the profile",
          "Categories Google watches closely, like locksmiths, garage doors and movers",
        ],
      },
      {
        h: "How to appeal",
        steps: [
          "Read the notice in your dashboard. 'Suspended' and 'Disabled' mean the same thing in practice: a policy issue.",
          "Fix the cause first: shorten the name to what's on your sign, hide your home address, or remove a duplicate.",
          "Gather proof: business license or registration, a utility bill or lease with the address, and photos of your signage, vehicle or storefront.",
          "Open the Business Profile appeals tool from the notice and submit everything in one appeal.",
          "Upload your documents as soon as you submit. The form gives you a limited window to attach them.",
          "Wait. Many appeals get an answer in a few business days, some take weeks. Don't send repeat appeals or edit the profile while you wait.",
        ],
      },
      {
        h: "What not to do",
        bullets: [
          "Don't create a new profile. It's treated as a duplicate and can make things worse.",
          "Don't pay anyone who promises a guaranteed reinstatement.",
          "Don't keep editing the profile during review.",
        ],
      },
    ],
    faqs: [
      { q: "Why was my brand-new Google Business Profile suspended?", a: "Usually because of keywords in the name, a virtual or shared address, a visible home address on a service-area business, or large edits right after verification. Google's automated checks are strictest with new profiles." },
      { q: "How long does Google take to reinstate a profile?", a: "Many appeals are answered in three to five business days, but owners regularly report waits of four to six weeks. Sending more appeals doesn't move you up the queue." },
      { q: "My appeal was denied. What now?", a: "You can ask for a second review after a denial through Google's local appeals form, and post in the Business Profile help community, where Product Experts can escalate. Add any evidence you missed the first time, with the same name and address on every document." },
      { q: "Will I lose my reviews if I'm suspended?", a: "Not if the original profile is reinstated. Reviews stay attached to it, which is why you appeal instead of starting over." },
    ],
    related: ["service-area-business-hide-address", "business-not-showing-on-google-maps", "google-business-profile-video-verification"],
  },
  {
    slug: "service-area-business-hide-address",
    topic: "google",
    industry: "home-services",
    title: "Run your business from home? How to hide your address on Google and still show up",
    description: "Set up a Google Business Profile as a service-area business: hide your home address, choose service areas that work, and get verified.",
    keyword: "hide address google business profile",
    updated: "2026-11-18",
    answer:
      "If customers don't come to you, set your profile up as a service-area business. During setup, say you deliver goods and services to customers, enter your address only for verification, and leave the address hidden from customers. Then list up to 20 towns, ZIP codes or neighborhoods you actually serve. Your home address stays private, and you still show up for searches in those areas.",
    sections: [
      {
        h: "Who should hide their address",
        bullets: [
          "Cleaners, plumbers, handymen, landscapers and other trades",
          "Mobile groomers, dog walkers and pet sitters",
          "Mobile nail, lash, makeup and massage pros",
          "Food trucks and caterers without a dining room",
        ],
        p: ["If customers do visit you, even at home, show the address. Google treats a hidden address on a place customers visit as a policy problem."],
      },
      {
        h: "Step by step",
        steps: [
          "In your profile, open 'Edit profile', then 'Location'.",
          "Turn off 'Show business address to customers', or clear the address field after verification.",
          "Under 'Service area', add the cities, ZIP codes or neighborhoods you serve. Keep it to about two hours' drive from your base.",
          "Verify with video: show your vehicle, tools and paperwork, not your house.",
          "Mention your main towns in your description and posts, so AI assistants connect you with those areas.",
        ],
      },
      {
        h: "Will I rank lower without an address?",
        p: [
          "You'll rank best near the address you verified with, even though customers can't see it. Listing far-away towns doesn't make you appear there. Reviews that mention the neighborhood and a website page for each main area help more.",
        ],
      },
    ],
    faqs: [
      { q: "Can I have a Google Business Profile without a storefront?", a: "Yes. Choose the service-area option, hide your address, and list the areas you serve." },
      { q: "My home address is showing. How do I remove it?", a: "Edit profile, Location, then turn off showing the address or clear it, and make sure a service area is set. The change can take a few days to go live." },
      { q: "How many service areas can I add?", a: "Up to 20. Pick the places you really serve; extra areas far away don't help you rank there." },
    ],
    related: ["get-clients-new-cleaning-business", "google-business-profile-video-verification", "google-business-profile-suspended-new-business"],
  },
  {
    slug: "get-first-google-reviews-new-business",
    topic: "reviews",
    title: "How to get your first 10 Google reviews (without breaking the rules)",
    description: "What to say, when to ask, and the review rules that trip up new owners: no discounts, no review stations, and why some reviews vanish.",
    keyword: "how to get google reviews for a new business",
    updated: "2026-11-18",
    answer:
      "Ask every happy customer in person, at the moment they're happiest, then send your direct review link by text within the hour. A QR code at the counter, mirror or truck window catches the rest. Don't offer discounts or freebies for reviews, don't have customers review on your shop tablet, and don't ask family to review, because Google filters all three.",
    sections: [
      {
        h: "A script that works",
        p: [
          "'We just opened, so reviews make a huge difference for us. Would you mind leaving one? I'll text you the link.' Then send it right away.",
          "Ask them to mention the service and the neighborhood, like 'deep clean in Mueller'. Those words help you show up when someone asks Google or ChatGPT for that service in that area.",
        ],
      },
      {
        h: "Where to put your review link",
        bullets: [
          "A text sent right after the visit (this gets the most reviews)",
          "A QR code at the register, on the mirror, on table tents or on the truck",
          "Your receipt or invoice email",
          "Your thank-you card",
        ],
      },
      {
        h: "Why reviews disappear or never show",
        bullets: [
          "Several reviews from the same Wi-Fi or device, such as a tablet in your shop",
          "A sudden burst of reviews after weeks of none",
          "Reviews from brand-new Google accounts with no other activity",
          "Reviews that were offered a discount or gift",
          "Reviews from family, staff or the owner",
        ],
        p: [
          "Brand-new profiles get the strictest filtering, so a steady pace beats a launch-day blitz: a few reviews a week from real customers is safer than twenty in one afternoon.",
          "New reviews can also take a day or two to appear. If a real review vanished, you can ask Google to look at it from the Reviews section of your profile, but there's no guarantee it comes back.",
        ],
      },
      {
        h: "Reply to every one",
        p: ["Thank them by name, mention what they bought, and keep it short. Replies show future customers you're active, and Google counts them as activity."],
      },
    ],
    faqs: [
      { q: "Can I offer a discount for a Google review?", a: "No. Google's rules forbid incentives for reviews, even for honest ones. Those reviews can be removed and the profile penalized." },
      { q: "Why did my Google reviews disappear?", a: "Google's spam filter removes reviews that look unnatural: several from the same Wi-Fi or device, sudden bursts, brand-new accounts, or incentivized reviews. Profiles under six months old are filtered hardest. Google has also had bugs that hid real reviews for days or weeks." },
      { q: "Should I ask customers to post their review again?", a: "No. Reposting often gets filtered again. Report the missing review from your dashboard or the Business Profile help community, and keep asking new customers at a steady pace." },
      { q: "Can my friends and family leave reviews?", a: "They shouldn't. Reviews from people with a conflict of interest break Google's rules and are often filtered." },
      { q: "How many reviews do I need to show up on Google Maps?", a: "There's no fixed number, but most new businesses see a clear lift once they pass 10 recent reviews, and more again past what nearby rivals have." },
    ],
    related: ["get-clients-new-cleaning-business", "business-not-showing-on-google-maps", "how-to-get-recommended-by-chatgpt-local-business"],
  },
  {
    slug: "why-isnt-my-business-on-chatgpt",
    topic: "ai",
    title: "Why isn't ChatGPT recommending my business? 6 reasons and fixes",
    description: "ChatGPT names the same rivals every time? Here's what it actually reads about local businesses, and why new ones get skipped.",
    keyword: "why isn't my business showing up in chatgpt",
    updated: "2026-11-18",
    answer:
      "ChatGPT recommends local businesses it can confirm across several sources, and a new business usually doesn't have them yet. The most common gaps are no Yelp page, no Bing Places listing, no website page describing your services, few reviews mentioning those services, and no mentions in industry directories or 'best of' lists. Fix the gap that matters most for your type of business first.",
    sections: [
      {
        h: "What ChatGPT reads about local businesses",
        p: [
          "When someone asks for a local recommendation, ChatGPT searches the web and summarizes what it finds. In 2026 tests, its picks leaned heavily on Yelp (which licensed its data to OpenAI), Bing, industry directories like Angi, Thumbtack and BBB, TripAdvisor and OpenTable for restaurants, and 'best of' lists from local sites.",
          "Google's AI answers lean on your Google profile instead. Gemini and Perplexity read business websites most. That's why one assistant can name you while another doesn't.",
        ],
      },
      {
        h: "The 6 reasons new businesses get skipped",
        steps: [
          "No Yelp page, or a Yelp page with a different name, phone or address.",
          "Not listed on Bing Places. Import your Google profile in one step.",
          "No website, or a one-page site that doesn't list your services, prices or towns.",
          "Reviews say 'great job!' but never name the service or neighborhood.",
          "Not on the directories for your trade, like Angi for home services or Booksy for beauty.",
          "Too new. Big rivals have years of mentions. You can close this gap faster on specific questions ('who does mobile dog grooming in Plano') than on 'best groomer'.",
        ],
      },
      {
        h: "Aim for specific questions first",
        p: [
          "Generic questions like 'best plumber in Austin' go to businesses with the most reviews. Specific questions, like 'emergency water heater repair in South Austin', go to businesses whose own website and reviews describe that exact service. That's where a new business can win in weeks, not years.",
        ],
      },
      { h: "Check what it says", p: ["Answers change from one day to the next. Ask the same question a few times, or run our free check, which asks ChatGPT, Google AI, Gemini and Perplexity the questions your customers ask and shows which sources each one read."] },
    ],
    faqs: [
      { q: "Why does ChatGPT recommend my competitor and not me?", a: "It can find more confirmation about them: more reviews, a Yelp page, directory listings and mentions on local sites. Compare their listings to yours and fill the gaps." },
      { q: "How long until ChatGPT recommends a new business?", a: "For specific service questions, a few weeks after your listings and service pages are live. For 'best X in town', it can take months of reviews and mentions." },
      { q: "Does ChatGPT use Google reviews?", a: "Sometimes, through third-party data, but it leans much more on Yelp, TripAdvisor and other sites it searches. Google's own AI uses your Google reviews directly." },
      { q: "Can I pay ChatGPT to recommend my business?", a: "No. Recommendations aren't for sale. Claiming your ChatGPT business profile makes your details accurate but doesn't buy placement." },
    ],
    related: ["how-to-get-recommended-by-chatgpt-local-business", "claim-your-business-on-chatgpt", "do-i-need-a-website-local-business"],
  },
  {
    slug: "do-i-need-a-website-local-business",
    topic: "ai",
    title: "Do I need a website for my local business in 2026?",
    description: "Not to get on Google Maps. But AI assistants cite business websites more than any other source. What a small site needs, and what it doesn't.",
    keyword: "do i need a website for my small business",
    updated: "2026-11-18",
    answer:
      "Not to get on Google Maps: a complete Google Business Profile is enough to start. But if you want AI assistants to recommend you, a simple website helps a lot. In a 2026 study of local AI answers, business websites were the most cited source, ahead of Google profiles and Yelp. A few pages that list your services, prices, towns and credentials are enough.",
    sections: [
      {
        h: "When you can skip it, for now",
        bullets: [
          "Your first week or two, while you set up Google, Apple Maps, Bing and Yelp",
          "Food trucks that live on Instagram and a weekly schedule post",
          "When a booking page (Booksy, Vagaro, Square) already lists your services and prices",
        ],
      },
      {
        h: "What a small site needs",
        steps: [
          "A home page with your name, address or service area, and phone, exactly as on Google.",
          "One page per main service, with what's included and a starting price.",
          "A page for each main town or neighborhood you serve, if you travel to customers.",
          "Proof: license number, insurance, certifications, years of experience.",
          "A short FAQ answering what customers ask on the phone.",
          "Your Google review link and booking link.",
        ],
      },
      {
        h: "What it doesn't need",
        bullets: [
          "A blog, unless you enjoy writing",
          "An agency or a monthly retainer. Square, Wix or Squarespace templates work fine.",
          "Fancy design. Clear text that answers questions is what AI assistants quote.",
        ],
      },
    ],
    faqs: [
      { q: "Can I use my Facebook page instead of a website?", a: "It helps people find your hours, but AI assistants rarely quote Facebook pages. A simple website with service pages does more." },
      { q: "Does my website need schema markup?", a: "It's nice to have and cheap to add, but studies so far show no clear effect on AI recommendations. Clear service pages matter more." },
      { q: "What should my website address be?", a: "Your business name, as short as you can get it. Use the same address on every profile." },
    ],
    related: ["why-isnt-my-business-on-chatgpt", "how-to-get-recommended-by-chatgpt-local-business", "new-business-marketing-checklist"],
  },
  {
    slug: "where-to-list-a-new-business",
    topic: "listings",
    title: "Where to list a new local business: the free listings that matter (and the ones to skip)",
    description: "Google, Apple Maps, Bing, Yelp and Facebook first, then the directories AI assistants cite for your trade. Skip paid citation bundles.",
    keyword: "where to list my new business online free",
    updated: "2026-11-18",
    answer:
      "Start with five free listings: Google Business Profile, Apple Business Connect, Bing Places, Yelp and Facebook. Use the exact same name, address and phone on each. Then add the two or three directories AI assistants cite for your trade, such as Angi and BBB for home services, Booksy or Vagaro for beauty, or TripAdvisor and OpenTable for restaurants. You don't need a paid service that pushes you to 100 directories.",
    sections: [
      {
        h: "The core five",
        steps: [
          "Google Business Profile: Maps, Search and Google's AI answers.",
          "Apple Business Connect: Apple Maps and Siri, used on every iPhone.",
          "Bing Places: import from Google in one step. Bing feeds Copilot and is one of the sources ChatGPT searches.",
          "Yelp: ChatGPT cites Yelp more than any other directory.",
          "Facebook page: people check it for hours and photos.",
        ],
      },
      {
        h: "Then the directories for your trade",
        bullets: [
          "Home services: Angi, BBB, Thumbtack, Nextdoor",
          "Beauty: Booksy, Vagaro, StyleSeat, Fresha",
          "Food trucks: Roaming Hunger, StreetFoodFinder",
          "Pet care: Nextdoor, Rover, BBB",
          "Wellness: Mindbody, ClassPass, Vagaro",
          "Restaurants: TripAdvisor, OpenTable",
        ],
      },
      {
        h: "What to skip",
        bullets: [
          "Paid bundles that list you on 100+ directories nobody reads",
          "Calls saying your Google listing will be removed unless you pay. Google listings are free.",
          "Foursquare and data aggregators, for now. Their effect on AI answers is disputed.",
        ],
      },
    ],
    faqs: [
      { q: "Is a Google Business Profile free?", a: "Yes. Creating, verifying and keeping a Google Business Profile is free. Anyone calling to charge you for it is not Google." },
      { q: "Does it matter if my listings don't match exactly?", a: "Yes. Different names, phone numbers or suite numbers make AI assistants and Google less sure you're the same business. Copy one master version everywhere." },
      { q: "Should I pay for Yelp ads?", a: "Not while you're new. A complete free Yelp page is what AI assistants read." },
    ],
    related: ["google-listing-scam-calls", "how-to-get-recommended-by-chatgpt-local-business", "google-business-profile-before-opening"],
  },
  {
    slug: "google-listing-scam-calls",
    topic: "listings",
    title: "'Your Google listing will be removed': scam calls new business owners get",
    description: "Registered a new LLC and now the phone won't stop? How to spot fake Google listing calls, what Google actually charges (nothing), and how to stop them.",
    keyword: "google business listing scam calls",
    updated: "2026-11-18",
    answer:
      "Google doesn't charge for a Business Profile and doesn't cold-call to threaten removal. New business owners get flooded with these calls because business registrations are public. Hang up on any call that asks for payment to 'verify', 'protect' or 'rank #1' your Google listing, never give anyone your Google login or verification code, and manage your profile yourself at business.google.com.",
    sections: [
      {
        h: "Common scripts",
        bullets: [
          "'Your Google listing is about to be marked closed.'",
          "'We're calling from Google to verify your business. Press 1.'",
          "'We guarantee you first page on Google Maps for $299 a month.'",
          "'Read me the code we just texted you.' (This hands them your profile.)",
        ],
      },
      {
        h: "How to protect your profile",
        steps: [
          "Own your profile with an email you control, not a contractor's.",
          "Never share a verification code or your password.",
          "Add any helpers as managers from your dashboard, so you can remove them later.",
          "Block and report the numbers. In the US, you can report to the FTC at reportfraud.ftc.gov.",
        ],
      },
    ],
    faqs: [
      { q: "Does Google call businesses?", a: "Rarely, and never to sell you a listing or threaten removal. Google may call about Google Ads you already run, or to confirm details, but a free profile never needs a payment." },
      { q: "Someone else claimed my Google listing. What do I do?", a: "Request ownership from the profile on Google Maps. The current owner has a few days to respond, and if they don't, you can get access." },
    ],
    related: ["where-to-list-a-new-business", "google-business-profile-suspended-new-business", "new-business-marketing-checklist"],
  },

  // Round 2 (Nov 18): profile setup details, other platforms, and industry setups owners ask about.
  {
    slug: "google-business-profile-categories",
    topic: "google",
    title: "Which Google Business Profile category should I pick? How to choose the right one",
    description: "Your primary category is the biggest single ranking factor on Google Maps. How new owners pick it, how many extra categories to add, and when to change it.",
    keyword: "google business profile primary category",
    updated: "2026-11-18",
    answer:
      "Choose the most specific primary category that describes what you are, not everything you do: 'Pet groomer', not 'Pet store'; 'Nail salon', not 'Beauty salon'. The primary category decides most of the searches you can show up for. Then add up to nine secondary categories for your other main services. Look at which categories the top three businesses near you use, because Google is clearly rewarding those.",
    sections: [
      {
        h: "How to choose your primary category",
        steps: [
          "Write down the one phrase most customers would type to find you, like 'house cleaning service' or 'taco truck'.",
          "Start typing it in the category box and pick the closest exact match Google offers. You can't make up your own.",
          "Search that phrase on Google Maps near you. The category under each top business's name is their primary category.",
          "If the top results all share one category and it fits you, use it.",
          "Pick the specific one over the broad one. 'Deck builder' beats 'Contractor' for deck searches.",
        ],
      },
      {
        h: "Secondary categories",
        p: [
          "Add the categories for your other main services, up to nine. Only add what you really do: a barbershop that also sells beard oil shouldn't add 'Cosmetics store'.",
          "Then list each service separately in the Services section, with a short description and price. Those words help with specific searches and with AI answers about that service.",
        ],
      },
      {
        h: "Changing your category later",
        p: [
          "You can change it, but a primary category change can send your profile back into review, and sometimes asks you to verify again. Make it right at setup, then leave it alone for the first few weeks after you verify.",
        ],
      },
    ],
    faqs: [
      { q: "How many categories can I have on Google Business Profile?", a: "One primary category and up to nine secondary categories, ten in total." },
      { q: "Does my primary category affect ranking?", a: "Yes. It's one of the strongest signals for which searches you show up in. Secondary categories help too, but less." },
      { q: "My exact business type isn't a category. What do I pick?", a: "The closest specific match. Then describe exactly what you do in your services, description and website, which is where Google and AI assistants pick up the detail." },
    ],
    related: ["business-not-showing-on-google-maps", "safely-edit-google-business-profile", "google-business-profile-before-opening"],
  },
  {
    slug: "fake-or-unfair-google-review",
    topic: "reviews",
    title: "Got a fake or unfair Google review as a new business? What to do",
    description: "When you only have five reviews, one 1-star hurts. How to report reviews that break Google's rules, how to reply to the ones that don't, and what never to do.",
    keyword: "how to remove a fake google review",
    updated: "2026-11-18",
    answer:
      "Report the review to Google if it breaks a rule: it's not from a real customer, it's from a competitor or ex-employee, it's spam, off-topic, or hateful. You can do that from the Reviews section of your profile, then check its status in Google's review management tool. Honest negative reviews won't be removed, so reply calmly and briefly, then focus on earning new reviews, which pushes it down and dilutes the average.",
    sections: [
      {
        h: "Reviews Google will remove",
        bullets: [
          "Fake reviews, or reviews from someone who was never a customer",
          "Reviews from competitors, current or former staff, or the owner",
          "Spam, ads or links",
          "Off-topic reviews about news, politics or another business",
          "Harassment, hate speech, or personal information",
          "Reviews used to blackmail you, such as 'pay or I'll leave more 1-stars'",
        ],
      },
      {
        h: "How to report one",
        steps: [
          "Open your profile, go to Reviews, find the review, and choose 'Report review'.",
          "Pick the reason that matches the policy it breaks.",
          "Check the status a few days later in Google's review management tool, where you can also appeal a decision once.",
          "If you're threatened with fake reviews unless you pay, report it as extortion. Never pay.",
        ],
      },
      {
        h: "How to reply to an honest bad review",
        steps: [
          "Wait until you're calm. Replies are public forever.",
          "Thank them, say you're sorry it fell short, and give one fact if it helps ('We now confirm every booking by text').",
          "Offer to fix it offline with a phone number or email.",
          "Keep it under four sentences. Future customers are the real audience.",
        ],
      },
      { h: "The real fix", p: ["One bad review on five is painful. One bad review on forty barely moves your average. Asking every happy customer, every day, is still the best protection."] },
    ],
    faqs: [
      { q: "Can I get a negative Google review removed?", a: "Only if it breaks Google's policies, for example if it's fake, from a competitor, off-topic or abusive. A real customer's honest bad review stays up." },
      { q: "How long does Google take to review a reported review?", a: "Often a few days, sometimes longer. You can check the status and appeal once in Google's review management tool." },
      { q: "Should I reply to a fake review?", a: "Yes, briefly and politely: say you have no record of them as a customer and invite them to contact you. Readers notice a calm reply." },
    ],
    related: ["get-first-google-reviews-new-business", "google-business-profile-suspended-new-business", "business-not-showing-on-google-maps"],
  },
  {
    slug: "safely-edit-google-business-profile",
    topic: "google",
    title: "Changing your business name, phone or address on Google without getting suspended",
    description: "Which Google Business Profile edits are safe any time, which ones can trigger re-verification or a suspension, and the safe way to make them.",
    keyword: "change phone number google business profile",
    updated: "2026-11-18",
    answer:
      "Posts, photos, review replies, hours and secondary categories are safe to change any time. Your business name, address, primary category, phone and website are the risky ones: changing them can send the profile back into review, ask you to verify again, or trigger a suspension if the change looks suspicious. Make risky changes one at a time, only when the real world has changed too, and update every other listing the same day.",
    sections: [
      {
        h: "Safe any time",
        bullets: ["Google posts, offers and events", "Photos and videos", "Replies to reviews", "Regular and holiday hours", "Services, menu and prices", "Secondary categories", "Description and attributes"],
      },
      {
        h: "Handle with care",
        bullets: [
          "Business name: only to your real name as on your sign and paperwork. Never add keywords or a city.",
          "Address: only if you actually moved. Edit the existing profile; don't create a new one.",
          "Primary category: can trigger re-verification. Choose it well at setup.",
          "Phone and website: change on Google, Yelp, Apple Maps, Bing and Facebook on the same day.",
          "Switching between storefront and service-area: a big change Google reviews closely.",
        ],
      },
      {
        h: "The safe way to make a big change",
        steps: [
          "Make sure the real world matches first: new sign, new paperwork, new phone actually answering.",
          "Make one risky change, then wait until it's published before the next.",
          "Don't make a burst of edits in a row. Space them out.",
          "Update every other listing and your website the same day, so the details match everywhere.",
          "Keep proof handy (license, utility bill, photo of the new sign) in case Google asks to verify again.",
        ],
      },
    ],
    faqs: [
      { q: "Will changing my phone number on Google get me suspended?", a: "Not usually, if the number is a real business line you control and you update it everywhere. Changing it at the same time as your name or address is riskier." },
      { q: "How do I change my business name on Google?", a: "If you rebranded, edit the name to match your new sign and paperwork. If it's a different business at the same spot, Google wants the old profile marked closed and a new one created." },
      { q: "Why is my edit 'under review' or 'not applied'?", a: "Google checks edits to name, address, category and phone. Reviews usually finish within a few days. If an edit is rejected, it often means Google couldn't confirm it from your sign, website or other listings." },
    ],
    related: ["google-business-profile-suspended-new-business", "moving-or-duplicate-google-business-profile", "google-business-profile-categories"],
  },
  {
    slug: "moving-or-duplicate-google-business-profile",
    topic: "google",
    title: "Duplicate Google Business Profile or moving locations? Fix it without losing reviews",
    description: "Google allows one profile per business. What to do when you move, when you find a duplicate, and when a previous tenant's listing sits at your address.",
    keyword: "duplicate google business profile",
    updated: "2026-11-23",
    answer:
      "Google allows one profile per business. If you move, edit the address on your existing profile instead of creating a new one, so you keep your reviews. If you accidentally made a second profile, remove the one with no reviews. If a duplicate you don't control has reviews, ask Google to merge it into yours, because merged profiles keep both sets of reviews.",
    sections: [
      {
        h: "If you're moving",
        steps: [
          "Wait until you're actually operating at the new address, with your sign up.",
          "Edit the address on your existing profile. Google may ask you to verify again.",
          "Update Apple Maps, Bing, Yelp, Facebook and your website on the same day.",
          "Post on Google that you've moved, with a photo of the new storefront.",
        ],
      },
      {
        h: "If there are two profiles for your business",
        bullets: [
          "One you made by mistake and it has no reviews: remove it from your dashboard. Removing deletes its content and managers.",
          "One you don't control, with reviews: suggest a merge from Google Maps or contact Business Profile support. Reviews are combined; some replies may be lost.",
          "A duplicate is hidden from Search and Maps, so leaving two around can mean the wrong one shows.",
        ],
      },
      {
        h: "An old business still shows at your address",
        p: [
          "Common when you take over a space. On Google Maps, open the old listing and suggest an edit marking it permanently closed or moved. On Apple Maps, use Report an Issue. Your own profile needs a different name and your own sign to be treated as separate.",
        ],
      },
    ],
    faqs: [
      { q: "Do I lose my Google reviews if I move?", a: "Not if you edit the address on your existing profile. Creating a new profile for the new address starts you from zero and creates a duplicate." },
      { q: "Can two businesses have Google profiles at the same address?", a: "Yes, if they're truly distinct, with different names and their own signage. Two businesses in the same category at one address often get filtered so only one shows." },
      { q: "What happens to reviews when Google merges two profiles?", a: "They're combined on the remaining profile, though replies to some reviews may be lost." },
    ],
    related: ["safely-edit-google-business-profile", "business-not-showing-on-google-maps", "google-business-profile-suspended-new-business"],
  },
  {
    slug: "show-up-in-google-ai-overviews-local-business",
    topic: "ai",
    title: "How a local business shows up in Google's AI Overviews and AI Mode",
    description: "Google's AI answers pull local details from your Business Profile, reviews and website. What Google says matters, and what to fix first.",
    keyword: "how to show up in google ai overviews local business",
    updated: "2026-11-18",
    answer:
      "Google's AI answers lean on your Google Business Profile, your reviews and your website. Google has said its AI features use the same ranking systems as search and run many related searches behind the scenes, so a complete profile matters most: the right categories, accurate hours and service areas, a detailed services list and recent photos. Reviews that mention specific services, and a website that answers customers' questions in plain words, do the rest.",
    sections: [
      {
        h: "What Google's AI reads about you",
        bullets: [
          "Your Business Profile: categories, services, hours, service areas, attributes and photos",
          "Your reviews, especially what people say about specific services",
          "Your website, if Google can crawl it and it says something specific",
          "Other sites that mention you: local news, blogs, community pages and 'best of' lists",
        ],
      },
      {
        h: "What to fix first",
        steps: [
          "Fill in every field of your Business Profile, especially services with short descriptions.",
          "Make hours and holiday hours exact. Wrong hours are a common reason AI answers skip or misdescribe a business.",
          "Ask reviewers to mention the service and neighborhood.",
          "Add an FAQ to your website using your customers' own words, like 'Do you take walk-ins?'.",
          "Keep your name, address and phone identical on your site and every listing.",
        ],
      },
      {
        h: "Check what it says",
        p: [
          "AI Overviews and AI Mode answers vary from person to person, so ranking in the map pack doesn't guarantee you're named. Ask AI Mode the questions your customers ask, note which sites it cites, and get listed on those. Check for mistakes, like wrong prices or policies, and fix the source.",
        ],
      },
    ],
    faqs: [
      { q: "How do I get my business in Google's AI Overview?", a: "Complete your Google Business Profile, earn reviews that mention your services, and publish clear answers to customer questions on your website. There's no form to apply." },
      { q: "Is AI Mode different from the Google Maps ranking?", a: "Related but not the same. AI Mode answers vary per person and pull from reviews and other websites, so a business can rank on Maps and still be left out, or the reverse." },
      { q: "Google's AI says something wrong about my business. How do I fix it?", a: "Find the source it's reading, usually your profile, website or a directory, and correct it there. You can also send feedback on the AI answer itself." },
    ],
    related: ["why-isnt-my-business-on-chatgpt", "google-business-profile-categories", "do-i-need-a-website-local-business"],
  },
  {
    slug: "apple-maps-business-connect-new-business",
    topic: "listings",
    title: "How to add your business to Apple Maps with Apple Business Connect (2026)",
    description: "Free, step by step: add or claim your business on Apple Maps with Apple Business Connect (formerly Apple Maps Connect), pass verification, and fix a stuck listing.",
    keyword: "how to add business to apple maps",
    updated: "2026-11-23",
    answer:
      "Sign in to Apple Business Connect (businessconnect.apple.com) with an Apple Account, search for your business, and claim it or add it as new. Verify by phone call or by uploading a business document such as a utility bill or license that shows the same name and address. Apple says verification can take up to five business days; owners often report longer. It's free.",
    sections: [
      {
        h: "Step by step",
        steps: [
          "Go to businessconnect.apple.com and sign in with an Apple Account the business will keep.",
          "Search for your business. Claim it if it's listed, or choose to add a new location.",
          "Enter your name, address, phone, website and category exactly as on Google.",
          "Verify by phone, or upload a document showing the business name and address.",
          "Add photos, hours and links (order, booking, menu) once approved.",
        ],
      },
      {
        h: "Apple Maps Connect is now Apple Business Connect",
        p: [
          "Apple replaced the old Apple Maps Connect (mapsconnect.apple.com) with Apple Business Connect in 2023. If a guide or a search result still sends you to Maps Connect, use businessconnect.apple.com instead. Your place card, photos and hours are all managed there now, and it's still free.",
        ],
      },
      {
        h: "Best practices for a new business",
        bullets: [
          "Use the exact name on your sign, with no added keywords. Apple, like Google, rejects names stuffed with services or locations.",
          "Copy your address, phone and hours character for character from your Google profile so the two never disagree.",
          "Pick the most specific category Apple offers, then add a few secondary ones.",
          "Add at least five real photos: storefront, inside, and your work or menu.",
          "Add action links (book, order, menu) so iPhone users can act straight from the place card.",
          "Use Showcases to post an offer or opening news. They appear on your place card.",
        ],
      },
      {
        h: "Common problems",
        bullets: [
          "Verification pending for weeks: re-upload a clearer document with the exact same name and address.",
          "A previous tenant's business shows at your address: report it in the Maps app with Report an Issue.",
          "Verified but not showing in search: give it a few days, then check the category and report the missing place from the Maps app.",
          "Home-based business: use the address on your paperwork and a matching utility bill; Apple has no hidden-address option like Google.",
        ],
      },
    ],
    faqs: [
      { q: "Is Apple Business Connect free?", a: "Yes. Adding and managing your place card on Apple Maps is free." },
      { q: "Does Apple Maps use my Google listing?", a: "No. Apple has its own data, so you need to add your business separately." },
      { q: "How long does Apple Maps verification take?", a: "Apple says up to about five business days. Owners regularly report a few weeks, especially when the document doesn't exactly match." },
      { q: "What happened to Apple Maps Connect?", a: "Apple replaced it with Apple Business Connect in 2023. Sign in at businessconnect.apple.com with an Apple Account to add or claim your business." },
      { q: "Do I need to pay an Apple Business Connect expert?", a: "No. Apple Business Connect is free and self-serve, and most new owners finish in under 30 minutes. Paying someone only makes sense if you manage many locations." },
    ],
    related: ["where-to-list-a-new-business", "bing-places-new-business", "google-business-profile-before-opening"],
  },
  {
    slug: "bing-places-new-business",
    topic: "listings",
    title: "Bing Places for a new business: the 5-minute import from Google",
    description: "Bing Places now lives at bing.com/forbusiness and can import your Google profile. Why it matters for Copilot and ChatGPT, and how to set it up.",
    keyword: "bing places for business",
    updated: "2026-11-18",
    answer:
      "Go to bing.com/forbusiness, sign in, and choose to import from your Google Business Profile. Bing copies your name, hours and contact details and can verify you instantly through the import. Then check every field matches Google exactly. It's free, takes about five minutes, and puts you in Bing, Copilot and one of the search sources ChatGPT uses.",
    sections: [
      {
        h: "Step by step",
        steps: [
          "Verify your Google Business Profile first. The import works best from a verified profile.",
          "Go to bing.com/forbusiness and sign in with a Microsoft, Google or Facebook account.",
          "Choose import from Google Business Profile and pick your business.",
          "Check name, address, phone, hours, website and category match Google exactly.",
          "Add photos and a description that names your main services and towns.",
        ],
      },
      {
        h: "Does ChatGPT use Bing?",
        p: [
          "In part. Research in 2026 found ChatGPT uses its own index plus several outside search providers, with Bing among them, and licensed data from Yelp and TripAdvisor for local answers. So Bing Places alone won't get you into ChatGPT, but it's a cheap gap to close, and Copilot uses it directly.",
        ],
      },
    ],
    faqs: [
      { q: "Is Bing Places free?", a: "Yes. Listing and managing your business on Bing Places is free." },
      { q: "Where did bingplaces.com go?", a: "Bing Places moved to bing.com/forbusiness in October 2025. Old accounts were moved over automatically." },
    ],
    related: ["apple-maps-business-connect-new-business", "where-to-list-a-new-business", "why-isnt-my-business-on-chatgpt"],
  },
  {
    slug: "yelp-for-new-business",
    topic: "listings",
    title: "Yelp for a new business: setup, the review filter, and why ChatGPT cares",
    description: "Why new businesses' Yelp reviews land in 'not recommended', what you're allowed to do about it, and why a Yelp page now matters for ChatGPT.",
    keyword: "yelp reviews not recommended new business",
    updated: "2026-11-18",
    answer:
      "Claim your free page at biz.yelp.com and make the name, address, phone and hours match Google exactly. New businesses often see early reviews marked 'not recommended', because Yelp's software trusts active, established reviewers more than one-time ones. You're not allowed to ask for Yelp reviews, but you can tell customers you're on Yelp, with a sticker or 'Find us on Yelp' sign. A complete Yelp page matters more than ever, because ChatGPT leans heavily on Yelp data for local recommendations.",
    sections: [
      {
        h: "Set up your page",
        steps: [
          "Search for your business at biz.yelp.com. Claim it, or add it if it's missing.",
          "Confirm ownership by phone or email.",
          "Copy your details from Google exactly, then add photos, services and 'specialties' in plain words.",
          "Write the 'history' section: who you are, when you opened, what you're known for.",
          "Skip ads while you're new. The free page is what AI assistants read.",
        ],
      },
      {
        h: "Why reviews go to 'not recommended'",
        bullets: [
          "The reviewer is new to Yelp, with no photo, friends or other reviews",
          "Several reviews arrive close together",
          "Reviews come from the same device or network as your business",
          "The review looks requested or incentivized",
        ],
        p: ["Yelp's software re-checks reviews over time, so a review can move into the recommended section later as the reviewer becomes more active."],
      },
      {
        h: "What you can do",
        bullets: [
          "Put up a Yelp sticker or 'Find us on Yelp' sign. Letting people know is fine; asking is not.",
          "Reply to every review, including filtered ones.",
          "Keep your page fresh with photos and updates.",
        ],
      },
    ],
    faqs: [
      { q: "Can I ask customers for Yelp reviews?", a: "No. Yelp's rules forbid asking for reviews. Asking for Google reviews is fine." },
      { q: "Why are my Yelp reviews not recommended?", a: "Yelp's software favors reviews from established, active Yelp users. Reviews from first-time users, bursts of reviews, or reviews that look requested often get filtered, especially for new businesses." },
      { q: "Does ChatGPT use Yelp?", a: "Yes. Yelp licenses its data to OpenAI, and studies in 2026 found Yelp behind most of ChatGPT's local business details." },
    ],
    related: ["why-isnt-my-business-on-chatgpt", "where-to-list-a-new-business", "get-first-google-reviews-new-business"],
  },
  {
    slug: "food-truck-google-business-profile",
    topic: "google",
    industry: "food-trucks",
    title: "Can a food truck have a Google Business Profile? How to set one up",
    description: "Google's guidelines don't mention food trucks directly. The two setups that work, how to verify, and how to tell customers where you'll be.",
    keyword: "food truck google business profile",
    updated: "2026-11-18",
    answer:
      "Yes. Most food trucks set up as a service-area business: verify with the address on your business paperwork, hide it from customers, and list the towns you serve. Then post your weekly locations as Google updates and keep Instagram and Yelp matching. If you park at the same spot every day during set hours with your own sign, you can show that address instead. Google's guidelines don't mention food trucks directly, so keep it simple and consistent.",
    sections: [
      {
        h: "Option 1: service-area business (most trucks)",
        steps: [
          "Choose that you serve customers at their locations, and hide the address.",
          "Use the address on your business license for verification.",
          "List the cities or neighborhoods you regularly park in.",
          "Verify with video: show the truck with its name, your kitchen, and your permits.",
        ],
      },
      {
        h: "Option 2: fixed spot",
        p: ["If you're at the same location every day during your posted hours, with your name on the truck or a sign, you can show that address. Change it only if you really move, because frequent address changes can trigger a suspension."],
      },
      {
        h: "Tell people where you are",
        bullets: [
          "Post this week's schedule as a Google update every Monday",
          "Keep a 'where we are' link on Instagram and Yelp",
          "List catering as a service, with a starting price",
          "Add your truck to Roaming Hunger and StreetFoodFinder",
        ],
      },
    ],
    faqs: [
      { q: "Is a food truck allowed on Google Maps?", a: "Yes. Most trucks list as a service-area business with a hidden address. Google's rules don't single out food trucks." },
      { q: "Should I change my Google address every time I park somewhere new?", a: "No. Frequent address changes look suspicious and can trigger a suspension. Post your schedule as an update instead." },
    ],
    related: ["find-food-truck-events-near-me", "service-area-business-hide-address", "google-business-profile-video-verification"],
  },
  {
    slug: "salon-suite-google-business-profile",
    topic: "google",
    industry: "beauty",
    title: "Salon suite or shared building? How to get your own Google profile that shows up",
    description: "Renting a suite in a salon building or a chair in a shared space? What Google allows, how to avoid being merged or filtered, and how to set it up.",
    keyword: "salon suite google business profile",
    updated: "2026-11-18",
    answer:
      "If you run your own business with its own name, you can have your own Google profile at a shared address. Put your suite number on address line 2, use your own phone number and booking link, and have your business name on a sign at your door. Google may still show only one business in the same category at one address for a given search, so reviews and a specific category matter even more for you.",
    sections: [
      {
        h: "What Google needs to see",
        bullets: [
          "Your own business name, the same on your sign, paperwork and profile",
          "Permanent signage with your name at your suite",
          "A phone number you control, not the building's front desk",
          "Your own website or booking page",
        ],
      },
      {
        h: "Set it up",
        steps: [
          "Enter the building address on line 1 and your suite number on line 2.",
          "Pick the most specific category for what you do: 'Nail salon', 'Eyelash salon', 'Barber shop'.",
          "Add your own phone and booking link.",
          "Verify with video: show the building sign, your suite door with your name, and you at work.",
        ],
      },
      {
        h: "Why you might not show up",
        p: [
          "Google filters similar businesses at the same address, so another stylist in your building can show instead of you for the same search. A suite number doesn't count as a separate address for this. Being more specific in your category and services, and earning more recent reviews, is how you stand out.",
        ],
      },
    ],
    faqs: [
      { q: "Can I have a Google Business Profile in a salon suite?", a: "Yes, if it's your own business with its own name and sign, and you serve clients there during your hours. Add your suite number on address line 2." },
      { q: "Why does Google show another salon in my building instead of me?", a: "Google's filter often shows only one business per category at an address for a given search. More specific categories, services and recent reviews help you win." },
      { q: "Can Google merge my profile with another business in my building?", a: "It can if the names, phones or websites look too similar. Use your own name, phone and website to stay separate." },
    ],
    related: ["get-clients-new-nail-salon", "google-business-profile-categories", "moving-or-duplicate-google-business-profile"],
  },
];

export const TOPICS: { id: NonNullable<Guide["topic"]>; name: string }[] = [
  { id: "google", name: "Google Business Profile and Maps" },
  { id: "reviews", name: "Reviews" },
  { id: "ai", name: "ChatGPT and AI assistants" },
  { id: "listings", name: "Listings and directories" },
  { id: "customers", name: "Getting your first customers" },
];

export const guideBySlug = (slug: string) => GUIDES_CONTENT.find((g) => g.slug === slug);
