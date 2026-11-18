import "server-only";
import { unstable_cache } from "next/cache";
import { env, has } from "../env";
import { seeded } from "../mock";
import type { Place } from "../types";

// Map grid rank check: where the shop shows up in Google Maps from 25 spots around it.
// Docs: https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
export const GRID_SIZE = 5;
const SPACING_MILES = Number(process.env.GRID_SPACING_MILES || 0.5);
const DEPTH = 20; // positions past 20 count as "not in the top 20"

export interface GridCell {
  lat: number;
  lng: number;
  rank: number | null; // 1-based Maps position, null when not in the top 20
}

export interface GridResult {
  keyword: string;
  cells: GridCell[]; // row by row, north to south, west to east
  top3: number;
  average: number | null; // average position of the spots where you appear
  spacingMiles: number;
  demo: boolean;
}

function points(lat: number, lng: number) {
  const dLat = SPACING_MILES / 69;
  const dLng = SPACING_MILES / (69 * Math.cos((lat * Math.PI) / 180));
  const half = (GRID_SIZE - 1) / 2;
  const out: { lat: number; lng: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) out.push({ lat: lat + (half - r) * dLat, lng: lng + (c - half) * dLng });
  }
  return out;
}

const auth = () => "Basic " + Buffer.from(`${env.dataforseoLogin}:${env.dataforseoPassword}`).toString("base64");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function rankAt(keyword: string, pt: { lat: number; lng: number }, place: Place): Promise<number | null> {
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify([
      { keyword, location_coordinate: `${pt.lat.toFixed(6)},${pt.lng.toFixed(6)},15z`, language_code: "en", depth: DEPTH },
    ]),
  });
  if (!res.ok) throw new Error(`DataForSEO ${res.status}`);
  const data = (await res.json()) as {
    tasks?: { result?: { items?: { type?: string; rank_group?: number; place_id?: string; title?: string }[] }[] }[];
  };
  const items = data.tasks?.[0]?.result?.[0]?.items || [];
  const hit = items.find((i) => (i.place_id && i.place_id === place.id) || (i.title && norm(i.title) === norm(place.name)));
  return hit?.rank_group ?? null;
}

function summarize(keyword: string, cells: GridCell[], demo: boolean): GridResult {
  const ranked = cells.filter((c) => c.rank != null).map((c) => c.rank!);
  return {
    keyword,
    cells,
    top3: ranked.filter((r) => r <= 3).length,
    average: ranked.length ? Math.round((ranked.reduce((a, b) => a + b, 0) / ranked.length) * 10) / 10 : null,
    spacingMiles: SPACING_MILES,
    demo,
  };
}

function mockGrid(place: Place, keyword: string): GridResult {
  const r = seeded(place.name + keyword);
  const lat = place.lat ?? 30.2672;
  const lng = place.lng ?? -97.7431;
  const half = (GRID_SIZE - 1) / 2;
  const cells = points(lat, lng).map((pt, i) => {
    const dist = Math.hypot(Math.floor(i / GRID_SIZE) - half, (i % GRID_SIZE) - half);
    const rank = Math.round(1 + dist * 4 + r() * 5);
    return { ...pt, rank: rank > DEPTH ? null : rank };
  });
  return summarize(keyword, cells, true);
}

async function liveGrid(place: Place, keyword: string): Promise<GridResult> {
  const pts = points(place.lat!, place.lng!);
  const cells = await Promise.all(
    pts.map(async (pt) => ({ ...pt, rank: await rankAt(keyword, pt, place).catch(() => null) })),
  );
  return summarize(keyword, cells, false);
}

const cachedGrid = unstable_cache(
  async (key: string, place: Place, keyword: string) => {
    void key;
    return liveGrid(place, keyword);
  },
  ["grid-v1"],
  { revalidate: 60 * 60 * 24 },
);

/** 5x5 grid of Google Maps positions. Sample data until DataForSEO keys are set. Cached a day. */
export async function mapGrid(place: Place, keyword: string): Promise<GridResult | null> {
  if (place.id === "new") return null;
  if (!has.dataforseo() || place.lat == null || place.lng == null || place.id.startsWith("demo_")) return mockGrid(place, keyword);
  try {
    return await cachedGrid(`${place.id}|${keyword}`, place, keyword);
  } catch (e) {
    console.error("grid", e);
    return mockGrid(place, keyword);
  }
}
