import { NextResponse } from "next/server";
import { z } from "zod";
import { allowIp, markHuman, verifyTurnstile } from "@/lib/guard";

const Body = z.object({ token: z.string().max(4000) });

// Passing the invisible bot check once lets a visitor open free checks for a day.
export async function POST(req: Request) {
  if (!(await allowIp("human", 30, 600))) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !(await verifyTurnstile(parsed.data.token))) return NextResponse.json({ ok: false }, { status: 403 });
  await markHuman();
  return NextResponse.json({ ok: true });
}
