export type IndustrySlug =
  | "home-services"
  | "beauty"
  | "food-trucks"
  | "pet"
  | "wellness"
  | "restaurants";

export interface Place {
  id: string; // Google place ID, or "new" for a business that isn't on Google yet
  name: string;
  address: string;
  city?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  primaryType?: string;
  primaryTypeLabel?: string;
  types?: string[];
  lat?: number;
  lng?: number;
  photoName?: string;
  hasHours?: boolean;
  mapsUrl?: string;
  status?: string; // OPERATIONAL, CLOSED_TEMPORARILY, ...
  termHint?: string; // what their website says they do, when Google's category is a catch-all like "Health"
  serviceArea?: boolean; // hides its address on Google; lat/lng/city then come from the town the owner serves
  ownerTerm?: string; // the business type the owner confirmed ("dance studio"); beats every guess
}

/** What the owner tells us that Google doesn't know. */
export interface OwnerProfile {
  placeId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
  industry: IndustrySlug;
  managesProfile: "yes" | "no" | "unsure" | "none";
  services: string;
  different: string;
  areas: string;
  email: string;
}

export type Engine = "chatgpt" | "claude" | "perplexity" | "gemini";

/** first: the answer's top pick. listed: recommended, lower down. mentioned: named but not recommended. */
export type Placement = "first" | "listed" | "mentioned" | "none";

export interface EngineAnswer {
  engine: Engine;
  prompt: string;
  mentionsYou: boolean;
  rivalsMentioned: string[]; // rival names
  picks?: string[]; // every business the answer recommended, rivals or not (best effort)
  placement?: Placement; // where you landed in this answer
  rank?: number; // your position among the businesses it recommended (1 = first), when listed
  excerpt: string;
  sources?: string[]; // sites the engine read or cited (domains)
}

/** "claim": a platform no outside check can see (Apple Maps, Bing Places, ChatGPT, Brave Search), shown as a step with a link, not counted. */
export type ListingState = "found" | "missing" | "different" | "unknown" | "claim";

export interface ListingCheck {
  platform: Platform;
  state: ListingState;
  note: string;
  url?: string;
}

export type Platform =
  | "google"
  | "apple"
  | "bing"
  | "yelp"
  | "facebook"
  | "chatgpt"
  | "brave";

export interface Rival extends Place {
  distanceMiles?: number;
  aiMentions: number; // how many AI answers named this rival
  profiles?: Partial<Record<Platform, boolean | null>>; // null = couldn't check
}

export interface Report {
  place: Place;
  industry: IndustrySlug;
  area: string;
  rivals: Rival[];
  answers: EngineAnswer[];
  listings: ListingCheck[];
  generatedAt: string;
  demo: boolean;
}

export interface LocalEvent {
  title: string;
  date: string; // ISO date or readable
  where: string;
  kind: string; // market, festival, drive, fair...
  why: string; // why it fits this business
  url?: string;
  pitch: string; // drafted outreach message
}

export interface RivalMove {
  rival: string;
  move: string;
  counter: string;
}

export interface WeeklyDigest {
  business: string;
  weekOf: string;
  visibility: { engine: Engine; mentionsYou: boolean; prompt: string }[];
  rivalMoves: RivalMove[];
  googlePost: string;
  reviewReplies: { review: string; reply: string }[];
  campaign: { title: string; idea: string };
  events: LocalEvent[];
  demo: boolean;
}

export interface LaunchKit {
  primaryCategory: string;
  secondaryCategories: string[];
  description: string;
  shortDescription: string;
  services: { name: string; description: string }[];
  keywords: string[];
  qa: { q: string; a: string }[];
  posts: { title: string; body: string }[];
  reviewRequest: { sms: string; email: string; inPerson: string };
  // Added Nov 18, 2026 (what ChatGPT, Gemini and Perplexity read besides Google). Optional for older kits.
  facts?: string[]; // credentials and specific, quotable facts, the same everywhere
  priceMenu?: { item: string; price: string }[];
  yelp?: { specialties: string; history: string };
  servicePages?: { title: string; slug: string; body: string }[];
  areaPage?: { title: string; slug: string; body: string };
  demo: boolean;
}
