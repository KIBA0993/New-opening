import { NextResponse } from "next/server";
import { guessIndustry } from "@/lib/industries";
import { getPlace } from "@/lib/providers/places";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") || undefined;
  const place = await getPlace(id, token);
  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ place: { ...place, industryGuess: guessIndustry(place.types, place.primaryType, place.name) } });
}
