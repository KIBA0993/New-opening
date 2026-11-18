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
          "Pick the most specific primary category, like 'Mobile pet groomer' rather than 'Pet store'.",
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
          "Bing Places: import your Google profile in one step. ChatGPT search leans on Bing.",
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
      { q: "Does ChatGPT use Google reviews?", a: "Not directly in most cases. ChatGPT search draws on Bing and licensed sources like Yelp. Google's own AI uses your Google reviews." },
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
          "Bing Places: import from Google in one step. ChatGPT search leans on Bing.",
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
];

export const TOPICS: { id: NonNullable<Guide["topic"]>; name: string }[] = [
  { id: "google", name: "Google Business Profile and Maps" },
  { id: "reviews", name: "Reviews" },
  { id: "ai", name: "ChatGPT and AI assistants" },
  { id: "listings", name: "Listings and directories" },
  { id: "customers", name: "Getting your first customers" },
];

export const guideBySlug = (slug: string) => GUIDES_CONTENT.find((g) => g.slug === slug);
