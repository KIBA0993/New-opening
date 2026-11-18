import type { Platform } from "./types";

// Guided claim steps. None of these platforms let a small new app create listings for owners,
// so we prefill every field and walk the owner through it. Links checked Nov 17, 2026.

export interface PlatformGuide {
  platform: Platform;
  name: string;
  why: string;
  url: string;
  minutes: number;
  steps: string[];
  fields: ("name" | "address" | "phone" | "website" | "category" | "short" | "description" | "services")[];
  note?: string;
}

export const GUIDES: PlatformGuide[] = [
  {
    platform: "google",
    name: "Google Business Profile",
    why: "Google Search and Maps send most local customers. ChatGPT and Gemini read it too.",
    url: "https://business.google.com/add",
    minutes: 20,
    steps: [
      "Open Google Business Profile and sign in with the Google account you'll keep for the business.",
      "Type your business name exactly as below. If Google suggests your business, pick it and request access.",
      "Pick the primary category below, then add the secondary ones after you're verified.",
      "Add your address, or the areas you serve if customers don't come to you.",
      "Paste your phone and website, then follow the verification steps in the coach.",
      "Once verified, paste the description, services, Q&A and your first post.",
    ],
    fields: ["name", "category", "address", "phone", "website", "description", "services"],
    note: "After you're verified, make edits in one sitting. Many small edits in a row can trigger a new review or a suspension.",
  },
  {
    platform: "apple",
    name: "Apple Business Connect",
    why: "Every iPhone uses Apple Maps and Siri for 'near me' searches.",
    url: "https://businessconnect.apple.com",
    minutes: 10,
    steps: [
      "Sign in with an Apple Account and choose 'Add a location'.",
      "Search for your business. Claim it if it's there, or add it as new.",
      "Paste the details below and choose the closest category.",
      "Verify by phone call or by uploading a business document.",
    ],
    fields: ["name", "category", "address", "phone", "website", "short"],
  },
  {
    platform: "bing",
    name: "Bing Places",
    why: "Bing powers Copilot and is one of the sources ChatGPT searches. It can copy your Google profile in one step.",
    url: "https://www.bing.com/forbusiness",
    minutes: 5,
    steps: [
      "Sign in and choose 'Import from Google Business Profile' (fastest), or add it manually.",
      "Check the name, address and phone match the details below exactly.",
      "Paste the short description and submit for verification.",
    ],
    fields: ["name", "address", "phone", "website", "short"],
  },
  {
    platform: "yelp",
    name: "Yelp",
    why: "AI tools quote Yelp more than any other directory when they recommend local businesses.",
    url: "https://biz.yelp.com",
    minutes: 10,
    steps: [
      "Search for your business on Yelp for Business. Claim it, or add it if it's missing.",
      "Yelp will call or email to confirm you're the owner.",
      "Paste your details and the 'Specialties' text below, and add at least 5 photos.",
    ],
    fields: ["name", "category", "address", "phone", "website", "description"],
    note: "Yelp doesn't allow asking customers for reviews. Use your review link and QR code for Google only.",
  },
  {
    platform: "facebook",
    name: "Facebook Page",
    why: "Locals check Facebook for hours, photos and events, and AI tools read it.",
    url: "https://www.facebook.com/pages/create",
    minutes: 10,
    steps: [
      "Create a Page with your business name and category.",
      "Paste the short description as your bio, then add your address, phone, website and hours.",
      "Add a profile photo (your logo) and a cover photo of your work or storefront.",
    ],
    fields: ["name", "category", "address", "phone", "website", "short"],
  },
  {
    platform: "chatgpt",
    name: "ChatGPT business profile",
    why: "New this month: businesses can claim their profile in ChatGPT and add a description, website and photos.",
    url: "https://chatgpt.com/business-hub",
    minutes: 15,
    steps: [
      "Open Business Hub in ChatGPT, signed in with an account the business controls.",
      "Search for your business and pick the right listing. If it isn't there yet, join the waitlist and come back after your Google profile is live.",
      "Verify with your business phone, business email or website domain.",
      "Finish the identity check (you may need a photo ID and your business registration).",
      "Once approved, paste the description, category and website below.",
    ],
    fields: ["name", "category", "website", "description"],
    note: "This is a beta. At launch, only existing US listings could be claimed, and claiming doesn't guarantee ChatGPT will recommend you.",
  },
];
