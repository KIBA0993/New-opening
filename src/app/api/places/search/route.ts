import { NextResponse } from "next/server";
import { guessIndustry } from "@/lib/industries";
import { searchBusinesses } from "@/lib/providers/places";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2 || q.length > 200) return NextResponse.json({ places: [], demo: false });
  try {
    const { places, demo } = await searchBusinesses(q);
    return NextResponse.json({
      demo,
      places: places.map((p) => ({ ...p, industryGuess: guessIndustry(p.types, p.primaryType, p.name) })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Search isn't working right now. Please try again in a minute." }, { status: 502 });
  }
}
