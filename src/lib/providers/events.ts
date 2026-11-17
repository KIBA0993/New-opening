import "server-only";
import { env, has } from "../env";
import type { Industry } from "../industries";
import { searchJSON } from "./ai";

export interface RawEvent {
  title: string;
  date: string;
  where: string;
  kind: string;
  url?: string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** PredictHQ free plan: community events, festivals and expos within ~15 km for the next 5 weeks. */
async function predictHQ(lat: number, lng: number): Promise<RawEvent[]> {
  const now = new Date();
  const until = new Date(now.getTime() + 35 * 864e5);
  const url = new URL("https://api.predicthq.com/v1/events/");
  url.searchParams.set("within", `15km@${lat},${lng}`);
  url.searchParams.set("active.gte", iso(now));
  url.searchParams.set("active.lte", iso(until));
  url.searchParams.set("category", "community,festivals,expos,performing-arts");
  url.searchParams.set("sort", "-local_rank");
  url.searchParams.set("limit", "15");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env.predicthq}`, Accept: "application/json" } });
  if (!res.ok) {
    console.error("PredictHQ", res.status, await res.text());
    return [];
  }
  const data = (await res.json()) as {
    results?: { title: string; start: string; category: string; entities?: { name?: string; formatted_address?: string; type?: string }[] }[];
  };
  return (data.results || []).map((e) => {
    const venue = e.entities?.find((x) => x.type === "venue");
    return {
      title: e.title,
      date: e.start?.slice(0, 10),
      where: [venue?.name, venue?.formatted_address?.split("\n")[0]].filter(Boolean).join(", ") || "Nearby",
      kind: e.category.replace("-", " "),
    };
  });
}

/** AI web search fills the gaps PredictHQ misses: farmers markets, night markets, vendor calls, drives. */
async function aiSearchEvents(city: string, industry: Industry): Promise<RawEvent[]> {
  const out = await searchJSON<{ events?: RawEvent[] }>(
    `List up to 8 real, upcoming local events in or near ${city} in the next 5 weeks that a ${industry.term} business could join as a vendor, sponsor or volunteer: ${industry.eventKinds.join(", ")}, holiday markets, toy and food drives.
Only include events with a known date and a public web page. Return JSON: {"events":[{"title":"","date":"YYYY-MM-DD","where":"venue, neighborhood","kind":"market|festival|drive|fair|other","url":"https://..."}]}`,
  );
  return (out?.events || []).filter((e) => e.title && e.date);
}

export async function findEvents(city: string, industry: Industry, lat?: number, lng?: number): Promise<{ events: RawEvent[]; demo: boolean }> {
  const live = has.predicthq() || has.perplexity() || has.openai();
  if (!live) return { events: mockEvents(city, industry), demo: true };
  const [a, b] = await Promise.all([
    has.predicthq() && lat != null && lng != null ? predictHQ(lat, lng).catch(() => []) : Promise.resolve([]),
    aiSearchEvents(city, industry).catch(() => []),
  ]);
  const seen = new Set<string>();
  const events = [...b, ...a]
    .filter((e) => {
      const k = e.title.toLowerCase().slice(0, 30);
      return seen.has(k) ? false : (seen.add(k), true);
    })
    .sort((x, y) => x.date.localeCompare(y.date))
    .slice(0, 5);
  return { events, demo: false };
}

export function mockEvents(city: string, industry: Industry): RawEvent[] {
  const town = city.split(",")[0];
  const d = (days: number) => iso(new Date(Date.now() + days * 864e5));
  const base: RawEvent[] = [
    { title: `${town} Holiday Night Market`, date: d(9), where: "Downtown plaza", kind: "market" },
    { title: "Saturday Farmers Market", date: d(4), where: "Mueller Lake Park", kind: "market" },
    { title: "Community Toy Drive", date: d(14), where: "Eastside library branch", kind: "drive" },
    { title: `${town} Winter Makers Fair`, date: d(18), where: "Convention center, hall B", kind: "fair" },
    { title: "Neighborhood Association Holiday Mixer", date: d(11), where: "Rec center", kind: "community" },
  ];
  if (industry.slug === "pet") base[4] = { title: "Shelter Adoption Day", date: d(11), where: "City animal center", kind: "adoption day" };
  return base;
}
