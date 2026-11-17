import { NextResponse } from "next/server";
import { autocomplete } from "@/lib/providers/places";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = u.searchParams.get("q")?.trim() || "";
  const token = u.searchParams.get("token") || "";
  if (q.length < 3 || q.length > 120) return NextResponse.json({ suggestions: [] });
  try {
    return NextResponse.json({ suggestions: await autocomplete(q, token) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
