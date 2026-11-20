import { NextResponse } from "next/server";
import { z } from "zod";
import { allowIp } from "@/lib/guard";
import { getAccount, spendCredit } from "@/lib/credits";
import { getPlace, locateTown } from "@/lib/providers/places";
import { freshCheck } from "@/lib/report";
import type { Place } from "@/lib/types";

export const maxDuration = 120;

const Body = z.object({ session_id: z.string().min(5).max(2000) });

// Autopilot re-check: runs the AI questions again, skipping the cache, and uses one credit.
export async function POST(req: Request) {
  if (!(await allowIp("recheck", 10, 600))) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing subscription link." }, { status: 400 });
  const account = await getAccount(parsed.data.session_id);
  if (!account) return NextResponse.json({ error: "We couldn't find an active Autopilot for this link." }, { status: 404 });
  if (account.left <= 0) return NextResponse.json({ error: "You're out of re-checks. Add more below, or wait for next month's.", left: 0 }, { status: 402 });

  const p = account.profile;
  const place: Place =
    (p.placeId !== "new" && (await getPlace(p.placeId).then((pl) => pl && locateTown(pl, p.city)))) || { id: "new", name: p.name, address: p.address, city: p.city, reviewCount: 0 };
  try {
    const result = await freshCheck(place, p.industry);
    await spendCredit(account);
    return NextResponse.json({ ...result, left: account.left - 1 });
  } catch (e) {
    console.error("recheck", e);
    return NextResponse.json({ error: "The AI check didn't finish. No credit was used. Please try again in a minute." }, { status: 502 });
  }
}
