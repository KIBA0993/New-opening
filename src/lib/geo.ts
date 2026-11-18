import "server-only";
import { headers } from "next/headers";

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Rough visitor location from Vercel's IP geo headers, used to rank nearby businesses first. Null locally. */
export async function visitorLocation(): Promise<LatLng | null> {
  const h = await headers();
  const latitude = Number(h.get("x-vercel-ip-latitude"));
  const longitude = Number(h.get("x-vercel-ip-longitude"));
  if (!h.get("x-vercel-ip-latitude") || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

/** Prefer results near the visitor without hiding businesses elsewhere (typing a city still wins). */
export const nearBias = (center: LatLng | null) => (center ? { locationBias: { circle: { center, radius: 50000 } } } : {});
