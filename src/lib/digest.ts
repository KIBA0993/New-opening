import "server-only";
import { industryBySlug, searchTerm, buildPrompts } from "./industries";
import { seeded } from "./mock";
import { askEngine, engineAvailable, mentions, writeJSON } from "./providers/ai";
import { findEvents, type RawEvent } from "./providers/events";
import { findRivals, getPlace, latestReviews } from "./providers/places";
import { postUpdateTasks, readUpdateTasks, rivalAnnouncements } from "./providers/rivalMoves";
import type { Engine, LocalEvent, OwnerProfile, Place, RivalMove, WeeklyDigest } from "./types";

// What we remember between weeks (kept small enough for Stripe subscription metadata).
export interface Snapshot {
  r: [string, number, number][]; // rival place id, rating, review count
  t: string[]; // DataForSEO task ids posted last week
}

export function packSnapshot(s: Snapshot) {
  let out = JSON.stringify(s);
  while (out.length > 490 && s.t.length) {
    s.t.pop();
    out = JSON.stringify(s);
  }
  return out;
}

export function unpackSnapshot(s?: string | null): Snapshot | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as Snapshot;
  } catch {
    return null;
  }
}

const ENGINES: Engine[] = ["chatgpt", "perplexity", "gemini"];

export async function composeDigest(profile: OwnerProfile, prev: Snapshot | null): Promise<{ digest: WeeklyDigest; next: Snapshot }> {
  const industry = industryBySlug(profile.industry)!;
  const place: Place =
    (profile.placeId !== "new" && (await getPlace(profile.placeId))) ||
    ({ id: "new", name: profile.name, address: profile.address, city: profile.city } as Place);
  const term = searchTerm(industry, place.primaryTypeLabel);
  const area = place.city || profile.city;
  const { rivals, demo: rivalsDemo } = await findRivals(place, profile.industry, `${term} near ${area}`);

  // 1) AI visibility re-check: one prompt per engine keeps the weekly cost to a few cents.
  const prompt = buildPrompts(industry, term, area)[0];
  const visibility = await Promise.all(
    ENGINES.map(async (engine) => {
      if (!engineAvailable(engine)) return { engine, prompt, mentionsYou: seeded(profile.name + engine)() > 0.6 };
      try {
        return { engine, prompt, mentionsYou: mentions(await askEngine(engine, prompt), place.name) };
      } catch {
        return { engine, prompt, mentionsYou: false };
      }
    }),
  );

  // 2) Rival moves: rating and review changes, new Google posts, announced deals.
  const moves: { rival: string; move: string }[] = [];
  if (prev) {
    for (const r of rivals) {
      const old = prev.r.find((x) => x[0] === r.id);
      if (!old) continue;
      const gained = (r.reviewCount || 0) - old[2];
      if (gained >= 3) moves.push({ rival: r.name, move: `Got ${gained} new Google reviews this week (now ${r.reviewCount}).` });
      if (r.rating && old[1] && r.rating - old[1] <= -0.1) moves.push({ rival: r.name, move: `Rating slipped from ${old[1]} to ${r.rating}.` });
    }
  }
  const posts = await readUpdateTasks(prev?.t || []);
  for (const p of posts.slice(0, 3)) {
    const name = rivals.find((r) => r.id === p.placeId)?.name || "A nearby rival";
    moves.push({ rival: name, move: `Posted on Google: "${p.text.slice(0, 120)}${p.text.length > 120 ? "…" : ""}"` });
  }
  moves.push(...(await rivalAnnouncements(rivals.slice(0, 5), area)));
  const nextTasks = await postUpdateTasks(rivals.map((r) => r.id).filter((id) => !id.startsWith("demo_")));
  const demoMoves = rivalsDemo && moves.length === 0;
  if (demoMoves) {
    moves.push(
      { rival: rivals[0]?.name || "A nearby rival", move: "Posted a holiday gift card deal on Google." },
      { rival: rivals[1]?.name || "Another rival", move: "Got 6 new Google reviews this week." },
    );
  }

  // 3) Events nearby and reviews to answer.
  const { events: rawEvents, demo: eventsDemo } = await findEvents(area, industry, place.lat, place.lng);
  const reviews = await latestReviews(place.id);

  // 4) Write it all in one call.
  const season = new Date().toLocaleString("en-US", { month: "long" });
  const written = await writeJSON<{
    googlePost: string;
    counters: string[];
    reviewReplies: string[];
    campaign: { title: string; idea: string };
    events: { why: string; pitch: string }[];
  }>(
    "You help a new local business owner do their weekly marketing in 5 minutes. Plain, friendly, specific. No hype words. Never invent facts.",
    `Business: ${place.name}, a ${term} in ${area}. ${industry.menuWord}: ${profile.services}. Different because: ${profile.different}. Month: ${season}.
Rival moves this week:\n${moves.map((m, i) => `${i + 1}. ${m.rival}: ${m.move}`).join("\n") || "none"}
New reviews:\n${reviews.map((r, i) => `${i + 1}. ${r.rating} stars: ${r.text}`).join("\n") || "none"}
Events:\n${rawEvents.map((e, i) => `${i + 1}. ${e.title}, ${e.date}, ${e.where}`).join("\n") || "none"}

Return JSON: {
 "googlePost": "one Google post for this week, under 600 chars",
 "counters": ["one counter-move per rival move, same order, one sentence each"],
 "reviewReplies": ["one reply per review, same order, under 300 chars"],
 "campaign": {"title": "", "idea": "one seasonal campaign idea in 2 sentences"},
 "events": [{"why": "why this event fits, one sentence", "pitch": "a short, friendly message to the organizer asking to join as a vendor or sponsor, under 500 chars, with [YOUR NAME] and [PHONE]"}]
}`,
  );

  const fallbackCampaign = industry.campaigns[new Date().getDate() % industry.campaigns.length];
  const rivalMoves: RivalMove[] = moves.slice(0, 5).map((m, i) => ({
    ...m,
    counter: written?.counters?.[i] || counterFor(m.move),
  }));
  const events: LocalEvent[] = rawEvents.map((e, i) => ({
    ...e,
    why: written?.events?.[i]?.why || whyFor(e, industry.term),
    pitch: written?.events?.[i]?.pitch || pitchFor(e, place.name, industry.term),
  }));

  const digest: WeeklyDigest = {
    business: place.name,
    weekOf: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    visibility,
    rivalMoves,
    googlePost:
      written?.googlePost ||
      `${season} at ${place.name}: ${profile.different || "we're here for the neighborhood"}. ${profile.services ? `Book ${profile.services.split(",")[0].trim().toLowerCase()} this week` : "Stop by this week"} and tell us you saw this post.`,
    reviewReplies: reviews.length
      ? reviews.map((r, i) => ({ review: `${r.rating}★ ${r.author}: ${r.text.slice(0, 160)}`, reply: written?.reviewReplies?.[i] || `Thank you so much, ${r.author.split(" ")[0]}! We're so glad you came in.` }))
      : [{ review: "5★ Maria G.: So happy I found this place, super friendly!", reply: `Thank you, Maria! Being new, reviews like yours mean a lot. See you next time!` }],
    campaign: written?.campaign || fallbackCampaign,
    events,
    demo: !written || rivalsDemo || eventsDemo,
  };

  const next: Snapshot = { r: rivals.map((r) => [r.id, r.rating || 0, r.reviewCount || 0]), t: nextTasks };
  return { digest, next };
}

function counterFor(move: string) {
  if (/review/i.test(move)) return "Text your last 5 customers your review link today. It takes 2 minutes.";
  if (/deal|discount|gift/i.test(move)) return "Don't race to the bottom on price. Post a small add-on instead, like a free upgrade this week.";
  if (/posted/i.test(move)) return "Post your own update this week. The draft below is ready to paste.";
  return "Keep doing your weekly post and review asks. Consistency wins.";
}

function whyFor(e: RawEvent, term: string) {
  return `A ${e.kind} crowd is local and ready to try something new, a good fit for a ${term}.`;
}

function pitchFor(e: RawEvent, name: string, term: string) {
  return `Hi! I run ${name}, a new ${term} nearby. We'd love to be part of ${e.title} on ${e.date}, as a vendor or a small sponsor. Is there still room? Happy to share photos and details. [YOUR NAME], [PHONE]`;
}
