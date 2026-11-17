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
  mapsUrl?: string;
  status?: string; // OPERATIONAL, CLOSED_TEMPORARILY, ...
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

export type Engine = "chatgpt" | "perplexity" | "gemini";

export interface EngineAnswer {
  engine: Engine;
  prompt: string;
  mentionsYou: boolean;
  rivalsMentioned: string[]; // rival names
  excerpt: string;
}

export type ListingState = "found" | "missing" | "different" | "unknown";

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
  | "chatgpt";

export interface Rival extends Place {
  distanceMiles?: number;
  aiMentions: number; // how many AI answers named this rival
  profiles?: Partial<Record<Platform, boolean>>;
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
  demo: boolean;
}
