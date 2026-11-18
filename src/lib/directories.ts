import type { IndustrySlug } from "./types";

// The industry directories AI assistants cite most when they recommend a local business.
// ChatGPT leans on directories and "best of" lists far more than on Google (Cheers, Sep 2026:
// a directory, review site or list in 84% of cited home-services answers). Order = most useful first.

export interface Directory {
  name: string;
  domain: string; // matched against search result domains
  url: string; // where owners sign up or claim
  why: string;
}

const ANGI: Directory = { name: "Angi", domain: "angi.com", url: "https://www.angi.com/pro/", why: "One of the sites ChatGPT cites most for home services." };
const BBB: Directory = { name: "BBB", domain: "bbb.org", url: "https://www.bbb.org/get-listed", why: "A free listing. Perplexity cites BBB in about a third of local answers." };
const THUMBTACK: Directory = { name: "Thumbtack", domain: "thumbtack.com", url: "https://www.thumbtack.com/pro", why: "Cited by ChatGPT for home and pet services, and a source of leads." };
const NEXTDOOR: Directory = { name: "Nextdoor", domain: "nextdoor.com", url: "https://business.nextdoor.com", why: "Neighbors recommend local businesses here, and the pages are public." };
const TRIPADVISOR: Directory = { name: "Tripadvisor", domain: "tripadvisor.com", url: "https://www.tripadvisor.com/Owners", why: "ChatGPT's second most used source for restaurant and food answers." };
const OPENTABLE: Directory = { name: "OpenTable", domain: "opentable.com", url: "https://restaurant.opentable.com", why: "ChatGPT pulls restaurant details from OpenTable in about 1 in 6 answers." };
const VAGARO: Directory = { name: "Vagaro", domain: "vagaro.com", url: "https://www.vagaro.com/pro", why: "A booking directory that shows up in local beauty and wellness answers." };

export const INDUSTRY_DIRECTORIES: Record<IndustrySlug, Directory[]> = {
  "home-services": [ANGI, BBB, THUMBTACK, NEXTDOOR],
  beauty: [
    { name: "Booksy", domain: "booksy.com", url: "https://biz.booksy.com", why: "A booking directory clients and AI tools use to find salons and barbers." },
    VAGARO,
    { name: "StyleSeat", domain: "styleseat.com", url: "https://www.styleseat.com", why: "Profiles for independent stylists and nail and lash artists." },
    { name: "Fresha", domain: "fresha.com", url: "https://www.fresha.com/for-business", why: "A free booking profile with public reviews." },
  ],
  "food-trucks": [
    { name: "Roaming Hunger", domain: "roaminghunger.com", url: "https://roaminghunger.com", why: "The biggest food truck directory, used for catering searches." },
    { name: "StreetFoodFinder", domain: "streetfoodfinder.com", url: "https://streetfoodfinder.com", why: "Shows where you are parked today." },
    TRIPADVISOR,
  ],
  pet: [NEXTDOOR, BBB, THUMBTACK, { name: "Rover", domain: "rover.com", url: "https://www.rover.com", why: "Pet owners search here for walkers, sitters and boarding." }],
  wellness: [
    { name: "Mindbody", domain: "mindbody", url: "https://www.mindbodyonline.com/business", why: "The main directory for studios, spas and massage." },
    { name: "ClassPass", domain: "classpass.com", url: "https://classpass.com/partners", why: "Reaches people searching for classes and treatments nearby." },
    VAGARO,
  ],
  restaurants: [TRIPADVISOR, OPENTABLE, NEXTDOOR],
};

export const directoriesFor = (industry: IndustrySlug) => INDUSTRY_DIRECTORIES[industry] || [];
