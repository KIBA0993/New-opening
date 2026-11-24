import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cronAllowed } from "@/lib/cron";
import { dealOn } from "@/lib/deal";

// Runs once, at 12:05 AM Pacific on Dec 17 (see vercel.json), just after the launch deal ends.
// Every price on the site, in llms.txt and llms-full.txt and in the Offer schema comes from
// src/lib/priceFacts.ts and switches on its own; this clears every cached page at once so
// the homepage, /pricing, the vertical pages and both llms files all show the new prices
// within the same minute instead of whenever each one is next visited.
export async function GET(req: Request) {
  if (!cronAllowed(req)) return new NextResponse("Unauthorized", { status: 401 });
  if (dealOn()) return NextResponse.json({ switched: false, reason: "deal still on" });
  revalidateTag("kit-sales");
  revalidatePath("/", "layout");
  return NextResponse.json({ switched: true });
}
