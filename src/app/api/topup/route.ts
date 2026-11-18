import { NextResponse } from "next/server";
import { z } from "zod";
import { alertOwner, errText } from "@/lib/alert";
import { allowIp } from "@/lib/guard";
import { createTopup, getAccount } from "@/lib/credits";

const Body = z.object({ session_id: z.string().min(5).max(2000) });

export async function POST(req: Request) {
  if (!(await allowIp("topup", 10, 600))) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing subscription link." }, { status: 400 });
  const account = await getAccount(parsed.data.session_id);
  if (!account) return NextResponse.json({ error: "We couldn't find an active Autopilot for this link." }, { status: 404 });
  try {
    return NextResponse.json({ url: await createTopup(parsed.data.session_id, account) });
  } catch (e) {
    await alertOwner("topup", "A subscriber couldn't start a re-check top-up", { business: account.profile.name, error: errText(e) });
    return NextResponse.json({ error: "Checkout isn't working right now. Please try again in a minute." }, { status: 502 });
  }
}
