import { NextResponse } from "next/server";
import { clientIp, looksLikeBot } from "@/lib/guard";
import { EVENTS, recordEvent, recordView, type StatEvent } from "@/lib/stats";

// Page views and funnel events from the browser, for the admin page. Bots are skipped.
export async function POST(req: Request) {
  if (await looksLikeBot()) return new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { p?: string; r?: string; e?: string } | null;
  if (!body) return new NextResponse(null, { status: 204 });
  if (body.e) {
    if ((EVENTS as readonly string[]).includes(body.e)) await recordEvent(body.e as StatEvent);
  } else if (typeof body.p === "string" && body.p.startsWith("/") && !body.p.startsWith("/admin")) {
    await recordView(body.p.slice(0, 300), String(body.r || "").slice(0, 300), await clientIp(), req.headers.get("user-agent") || "");
  }
  return new NextResponse(null, { status: 204 });
}
