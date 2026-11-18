import "server-only";
import { unstable_cache } from "next/cache";
import { env, has } from "../env";
import { seeded } from "../mock";
import type { Place } from "../types";

// Map grid rank check: where the shop shows up in Google Maps from spots around it.
// The free check uses 3x3 (9 lookups, cached a day); Kit and Autopilot buyers get 5x5 (25, refreshed weekly).
// Docs: https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
export const FREE_GRID = 3;
export const FULL_GRID = 5;
const SPACING_MILES = Number(process.env.GRID_SPACING_MILES || 0.5);
const DEPTH = 20; // positions past 20 count as "not in the top 20"

export interface GridCell {
  lat: number;
  lng: number;
  rank: number | null; // 1-based Maps position, null when not in the top 20
}

export interface GridResult {
  keyword: string;
  size: number;
  cells: GridCell[]; // row by row, north to south, west to east
  top3: number;
  average: number | null; // average position of the spots where you appear
  spacingMiles: number;
  demo: boolean;
}

function points(lat: number, lng: number, size: number) {
  const dLat = SPACING_MILES / 69;
  const dLng = SPACING_MILES / (69 * Math.cos((lat * Math.PI) / 180));
  const half = (size - 1) / 2;
  const out: { lat: number; lng: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) out.push({ lat: lat + (half - r) * dLat, lng: lng + (c - half) * dLng });
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

function summarize(keyword: string, size: number, cells: GridCell[], demo: boolean): GridResult {
  const ranked = cells.filter((c) => c.rank != null).map((c) => c.rank!);
  return {
    keyword,
    size,
    cells,
    top3: ranked.filter((r) => r <= 3).length,
    average: ranked.length ? Math.round((ranked.reduce((a, b) => a + b, 0) / ranked.length) * 10) / 10 : null,
    spacingMiles: SPACING_MILES,
    demo,
  };
}

function mockGrid(place: Place, keyword: string, size: number): GridResult {
  const r = seeded(place.name + keyword);
  const lat = place.lat ?? 30.2672;
  const lng = place.lng ?? -97.7431;
  const half = (size - 1) / 2;
  const cells = points(lat, lng, size).map((pt, i) => {
    const dist = Math.hypot(Math.floor(i / size) - half, (i % size) - half);
    const rank = Math.round(1 + dist * 4 + r() * 5);
    return { ...pt, rank: rank > DEPTH ? null : rank };
  });
  return summarize(keyword, size, cells, true);
}

async function liveGrid(place: Place, keyword: string, size: number): Promise<GridResult> {
  const pts = points(place.lat!, place.lng!, size);
  const cells = await Promise.all(
    pts.map(async (pt) => ({ ...pt, rank: await rankAt(keyword, pt, place).catch(() => null) })),
  );
  return summarize(keyword, size, cells, false);
}

// Free 3x3: refreshed daily. Buyers' 5x5: refreshed weekly (their weekly re-check).
const dailyGrid = unstable_cache(
  async (key: string, place: Place, keyword: string, size: number) => {
    void key;
    return liveGrid(place, keyword, size);
  },
  ["grid-v2-daily"],
  { revalidate: 60 * 60 * 24 },
);
const weeklyGrid = unstable_cache(
  async (key: string, place: Place, keyword: string, size: number) => {
    void key;
    return liveGrid(place, keyword, size);
  },
  ["grid-v2-weekly"],
  { revalidate: 60 * 60 * 24 * 7 },
);

/** True once DataForSEO is connected. Until then real businesses see "coming soon", not made-up ranks. */
export const gridLive = () => has.dataforseo();

/**
 * Grid of Google Maps positions. Null for brand-new businesses (not on Maps yet), or for real
 * businesses before DataForSEO is connected. Sample businesses get sample data.
 */
export async function mapGrid(place: Place, keyword: string, size: number = FREE_GRID): Promise<GridResult | null> {
  if (place.id === "new" || place.lat == null || place.lng == null) return null;
  if (place.id.startsWith("demo_")) return mockGrid(place, keyword, size);
  if (!gridLive()) return null;
  try {
    const fn = size > FREE_GRID ? weeklyGrid : dailyGrid;
    return await fn(`${place.id}|${keyword}|${size}`, place, keyword, size);
  } catch (e) {
    console.error("grid", e);
    return null;
  }
}
