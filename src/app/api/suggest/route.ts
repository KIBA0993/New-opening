import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp } from "@/lib/ratelimit";
import { suggestAnswers, templateSuggestion } from "@/lib/suggest";

export const maxDuration = 30;

const Body = z.object({
  placeId: z.string().max(300).default("new"),
  name: z.string().min(1).max(200),
  address: z.string().max(400).default(""),
  city: z.string().max(200).default(""),
  industry: z.enum(["home-services", "beauty", "food-trucks", "pet", "wellness", "restaurants"]),
  typeLabel: z.string().max(100).optional(),
  types: z.array(z.string().max(60)).max(20).optional(),
  website: z.string().max(400).optional(),
});

// Each new business costs one AI call (then it's cached), so cap it per visitor.
const recent = new Map<string, number[]>();

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing business details." }, { status: 400 });
  const ip = await clientIp();
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 60 * 60_000);
  if (hits.length >= 20) return NextResponse.json(templateSuggestion(parsed.data));
  recent.set(ip, [...hits, now]);
  return NextResponse.json(await suggestAnswers(parsed.data));
}
