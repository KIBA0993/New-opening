import { NextResponse } from "next/server";
import { visitorLocation } from "@/lib/geo";
import { guessIndustry } from "@/lib/industries";
import { allowIp } from "@/lib/guard";
import { searchBusinesses } from "@/lib/providers/places";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2 || q.length > 200) return NextResponse.json({ places: [], demo: false });
  if (!(await allowIp("search", 30, 600))) {
    return NextResponse.json({ error: "Too many searches. Please wait a few minutes and try again.", places: [] }, { status: 429 });
  }
  try {
    const { places, demo } = await searchBusinesses(q, await visitorLocation());
    return NextResponse.json({
      demo,
      places: places.map((p) => ({ ...p, industryGuess: guessIndustry(p.types, p.primaryType, p.name) })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Search isn't working right now. Please try again in a minute." }, { status: 502 });
  }
}
