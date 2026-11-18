import "server-only";
import type { Industry } from "./industries";
import { mockEvents } from "./providers/events";
import type { WeeklyDigest } from "./types";

const NAMES: Record<string, string> = {
  "home-services": "Bright Day Cleaning",
  beauty: "Juniper Nail Studio",
  "food-trucks": "La Güera Tacos",
  pet: "Muddy Paws Grooming",
  wellness: "Northside Massage",
  restaurants: "Little Ember Pizza",
};

/** A hand-built sample email so visitors can see the autopilot without us spending API money. */
export function sampleDigest(industry: Industry): WeeklyDigest {
  const name = NAMES[industry.slug];
  const events = mockEvents("Austin, TX", industry).slice(0, 3);
  return {
    business: name,
    weekOf: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    demo: true,
    visibility: [
      { engine: "chatgpt", mentionsYou: false, prompt: `best ${industry.term} in Austin` },
      { engine: "perplexity", mentionsYou: true, prompt: `best ${industry.term} in Austin` },
      { engine: "gemini", mentionsYou: true, prompt: `best ${industry.term} in Austin` },
    ],
    rivalMoves: [
      { rival: "A rival 1.2 miles away", move: "Posted a holiday gift card deal on Google.", counter: "Skip the price war. Post a small free add-on for December bookings instead. The draft below does it." },
      { rival: "Another nearby rival", move: "Got 6 new Google reviews this week.", counter: "Text your last 5 customers your review link today. It takes two minutes." },
    ],
    googlePost: `December at ${name}: ${industry.campaigns[0].idea} Message us to book, and tell us you saw this post.`,
    reviewReplies: [
      { review: "5★ Maria G.: So happy I found this place. Friendly and on time!", reply: `Thank you, Maria! Being new, reviews like yours mean the world to us. See you next time!` },
    ],
    campaign: industry.campaigns[1],
    events: events.map((e) => ({
      ...e,
      why: `Lots of locals out shopping, and a ${e.kind} crowd likes trying something new.`,
      pitch: `Hi! I run ${name}, a new ${industry.term} nearby. We'd love to join ${e.title} on ${e.date} as a vendor or small sponsor. Is there still room? Happy to send photos. [YOUR NAME], [PHONE]`,
    })),
  };
}
