import "server-only";
import { unstable_cache } from "next/cache";
import { env, has } from "../env";
import { spend } from "../guard";
import { seeded } from "../mock";
import type { Place } from "../types";
import { dataforseoReady } from "./dfs";

// Map grid rank check: where the shop shows up in Google Maps from spots around it.
// The free check uses 3x3 (9 lookups, cached 3 days); Kit and Autopilot buyers get 5x5 (25, refreshed weekly).
//
// Two sources:
//  - Google Places API (New) Text Search (default). One search per spot, centered on that spot,
//    asking only for place ids. That's Google's "Text Search Essentials (IDs Only)" SKU, which has
//    no charge, so the grid costs nothing on the Places bill. Results follow Google's own ranking
//    near that point, which is close to (not identical to) the Maps app list.
//    Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
//  - DataForSEO Maps SERP (the real Maps list, about $0.002 a spot). Used only with GRID_PROVIDER=dataforseo
//    and money on the account; any spot it fails on falls back to Places.
//    Docs: https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
export const FREE_GRID = 3;
export const FULL_GRID = 5;
const SPACING_MILES = Number(process.env.GRID_SPACING_MILES || 0.5);
const RADIUS_M = Number(process.env.GRID_RADIUS_METERS || 2000); // how far around each spot Places looks first
const DEPTH = 20; // positions past 20 count as "not in the top 20"
const PROVIDER = (process.env.GRID_PROVIDER || "places").toLowerCase();

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

type Pt = { lat: number; lng: number };

function points(lat: number, lng: number, size: number) {
  const dLat = SPACING_MILES / 69;
  const dLng = SPACING_MILES / (69 * Math.cos((lat * Math.PI) / 180));
  const half = (size - 1) / 2;
  const out: Pt[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) out.push({ lat: lat + (half - r) * dLat, lng: lng + (c - half) * dLng });
  }
  return out;
}

const auth = () => "Basic " + Buffer.from(`${env.dataforseoLogin}:${env.dataforseoPassword}`).toString("base64");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function rankDataForSEO(keyword: string, pt: Pt, place: Place): Promise<number | null> {
  await spend("dataforseo");
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify([
      { keyword, location_coordinate: `${pt.lat.toFixed(6)},${pt.lng.toFixed(6)},15z`, language_code: "en", depth: DEPTH },
    ]),
  });
  if (!res.ok) throw new Error(`DataForSEO ${res.status}`);
  const data = (await res.json()) as {
    tasks?: { status_code?: number; status_message?: string; result?: { items?: { type?: string; rank_group?: number; place_id?: string; title?: string }[] }[] }[];
  };
  const task = data.tasks?.[0];
  if (task?.status_code !== 20000) throw new Error(`DataForSEO ${task?.status_code} ${task?.status_message}`);
  const items = task.result?.[0]?.items || [];
  const hit = items.find((i) => (i.place_id && i.place_id === place.id) || (i.title && norm(i.title) === norm(place.name)));
  return hit?.rank_group ?? null;
}

async function rankPlaces(keyword: string, pt: Pt, place: Place): Promise<number | null> {
  // Not counted against the Places daily cap: IDs-only searches are free. Their own cap guards runaway loops.
  await spend("grid");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": env.googlePlaces, "X-Goog-FieldMask": "places.id" },
    body: JSON.stringify({
      textQuery: keyword,
      pageSize: DEPTH,
      languageCode: "en",
      includePureServiceAreaBusinesses: true, // otherwise a business that hides its address never shows up
      locationBias: { circle: { center: { latitude: pt.lat, longitude: pt.lng }, radius: RADIUS_M } },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Places grid ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { places?: { id: string }[] };
  const i = (data.places || []).findIndex((p) => p.id === place.id);
  return i < 0 ? null : i + 1;
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
  const useDfs = PROVIDER === "dataforseo" && (await dataforseoReady());
  let failed = 0;
  const cells = await Promise.all(
    pts.map(async (pt) => {
      let rank: number | null;
      try {
        rank = useDfs
          ? await rankDataForSEO(keyword, pt, place).catch((e) => {
              console.error("grid dataforseo, using Places", e);
              return rankPlaces(keyword, pt, place);
            })
          : await rankPlaces(keyword, pt, place);
      } catch (e) {
        if (!failed) console.error("grid", e);
        failed++;
        rank = null;
      }
      return { ...pt, rank };
    }),
  );
  // A grid where most lookups failed would show "not in the top 20" everywhere. Throw so it isn't cached.
  if (failed > pts.length / 3) throw new Error(`grid: ${failed} of ${pts.length} lookups failed`);
  return summarize(keyword, size, cells, false);
}

// Free 3x3: refreshed every 3 days. Buyers' 5x5: refreshed weekly (their weekly re-check).
const dailyGrid = unstable_cache(
  async (key: string, place: Place, keyword: string, size: number) => {
    void key;
    return liveGrid(place, keyword, size);
  },
  ["grid-v3-daily"],
  { revalidate: 60 * 60 * 24 * 3 },
);
const weeklyGrid = unstable_cache(
  async (key: string, place: Place, keyword: string, size: number) => {
    void key;
    return liveGrid(place, keyword, size);
  },
  ["grid-v3-weekly"],
  { revalidate: 60 * 60 * 24 * 7 },
);

/** True once a grid source is connected (Google Places, or DataForSEO). Until then real businesses see "coming soon". */
export const gridLive = () => has.places() || (PROVIDER === "dataforseo" && has.dataforseo());

/**
 * Grid of Google Maps positions. Null for brand-new businesses (not on Maps yet), when no source
 * is connected, or when the lookups failed. Sample businesses get sample data.
 */
export async function mapGrid(place: Place, keyword: string, size: number = FREE_GRID): Promise<GridResult | null> {
  if (place.id === "new" || place.lat == null || place.lng == null) return null;
  if (place.id.startsWith("demo_")) return mockGrid(place, keyword, size);
  if (!gridLive()) return null;
  try {
    const fn = size > FREE_GRID ? weeklyGrid : dailyGrid;
    // A service-area business is centered on the town its owner gave, so the town is part of the key.
    const at = place.serviceArea ? `|${place.lat!.toFixed(3)},${place.lng!.toFixed(3)}` : "";
    return await fn(`${place.id}|${keyword}|${size}|${PROVIDER}${at}`, place, keyword, size);
  } catch (e) {
    console.error("grid", e);
    return null;
  }
}

// ---------- Reading the grid: one plain sentence, and where each pin sits on a map ----------

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

/** Direction and distance of a cell from the shop (the center cell). */
function whereIs(grid: GridResult, i: number) {
  const half = (grid.size - 1) / 2;
  const dr = Math.floor(i / grid.size) - half; // + is south
  const dc = (i % grid.size) - half; // + is east
  const miles = Math.round(Math.hypot(dr, dc) * grid.spacingMiles * 10) / 10;
  const angle = (Math.atan2(dc, -dr) * 180) / Math.PI; // 0 = north, clockwise
  const dir = COMPASS[Math.round(((angle + 360) % 360) / 45) % 8];
  const dist = miles >= 0.9 && miles <= 1.1 ? "about a mile" : `about ${miles} miles`;
  return `${dist} ${dir}`;
}

const rankText = (r: number | null) => (r == null ? "out of the top 20" : r <= 3 ? "top 3" : `#${r}`);

/** e.g. "You're top 3 near your shop, but drop to #11 about a mile south." */
export function gridSentence(grid: GridResult): string {
  const center = Math.floor(grid.cells.length / 2);
  const here = grid.cells[center].rank;
  const worse = (a: number | null, b: number | null) => (a ?? 99) > (b ?? 99);
  let worst = -1;
  let best = -1;
  grid.cells.forEach((c, i) => {
    if (i === center) return;
    if (worst < 0 || worse(c.rank, grid.cells[worst].rank)) worst = i;
    if (best < 0 || worse(grid.cells[best].rank, c.rank)) best = i;
  });
  const far = Math.round(grid.spacingMiles * ((grid.size - 1) / 2) * Math.SQRT2 * 10) / 10;
  if (here != null && here <= 3 && grid.top3 === grid.cells.length) return `You're top 3 on Google Maps everywhere we checked, up to ${far} miles from your shop.`;
  const start = here == null ? "You don't show up in Google Maps' top 20 even next to your shop" : here <= 3 ? "You're top 3 near your shop" : `You're #${here} near your shop`;
  const w = grid.cells[worst];
  if (worst >= 0 && worse(w.rank, here)) return `${start}, but drop to ${w.rank == null ? "outside the top 20" : `#${w.rank}`} ${whereIs(grid, worst)}.`;
  const b = grid.cells[best];
  if (best >= 0 && worse(here, b.rank)) return `${start}, and do best ${whereIs(grid, best)} (${rankText(b.rank)}).`;
  return `${start}, and about the same across ${far} miles around it.`;
}

/** Map zoom and each pin's position (in % of a square map centered on the shop). */
export function mapFrame(grid: GridResult) {
  const c = grid.cells[Math.floor(grid.cells.length / 2)];
  const spanMeters = grid.size * grid.spacingMiles * 1609.34; // grid plus half a step of margin each side
  const cos = Math.cos((c.lat * Math.PI) / 180);
  const zoom = Math.max(10, Math.min(17, Math.floor(Math.log2((156543.03392 * cos * 560) / spanMeters))));
  const world = 256 * 2 ** zoom;
  const mercY = (lat: number) => {
    const s = Math.sin((lat * Math.PI) / 180);
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * world;
  };
  // Zoom levels come in steps of 2x, so enlarge the map image a little to make the grid fill the frame.
  const spanPx = spanMeters / ((156543.03392 * cos) / 2 ** zoom);
  const scale = Math.max(1, Math.min(2, 560 / spanPx));
  const pins = grid.cells.map((cell) => ({
    x: 50 + ((((cell.lng - c.lng) / 360) * world) / 640) * 100 * scale,
    y: 50 + ((mercY(cell.lat) - mercY(c.lat)) / 640) * 100 * scale,
  }));
  return { lat: c.lat, lng: c.lng, zoom, scale, pins };
}
