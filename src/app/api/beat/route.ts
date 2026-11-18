import { NextResponse } from "next/server";
import { notCounted, visitorSource } from "@/lib/attribution";
import { clientIp, looksLikeBot } from "@/lib/guard";
import { decodeSource, nameSource } from "@/lib/sources";
import { EVENTS, recordEvent, recordView, type StatEvent } from "@/lib/stats";

// Page views and funnel events from the browser, for the admin page.
// Bots, the owner's own browsers, previews and local runs are skipped.
export async function POST(req: Request) {
  if ((await notCounted()) || (await looksLikeBot())) return new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { p?: string; v?: string; s?: string; e?: string } | null;
  if (!body) return new NextResponse(null, { status: 204 });
  if (body.e) {
    if ((EVENTS as readonly string[]).includes(body.e)) await recordEvent(body.e as StatEvent, await visitorSource());
  } else if (typeof body.p === "string" && body.p.startsWith("/") && !body.p.startsWith("/admin")) {
    // A new visit is credited to what brought it here this time (a returning visitor typing the address is Direct).
    const visit = body.v === "1" ? nameSource(decodeSource(String(body.s || "").slice(0, 300))) : undefined;
    await recordView(body.p.slice(0, 300), await clientIp(), req.headers.get("user-agent") || "", visit);
  }
  return new NextResponse(null, { status: 204 });
}
