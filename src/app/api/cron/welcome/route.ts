import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import { env, has } from "@/lib/env";
import { sendFirstEmail } from "@/lib/welcome";

export const maxDuration = 300;

// Runs hourly (see vercel.json). Sends the first Autopilot email to new subscribers who
// didn't reach the thank-you page, which normally sends it straight away.
export async function GET(req: Request) {
  if (env.cronSecret && req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!has.stripe()) return NextResponse.json({ sent: 0 });
  const since = Math.floor(Date.now() / 1000) - 3 * 86400;
  const out = { sent: 0, failed: 0 };
  for await (const sub of stripe().subscriptions.list({ status: "active", created: { gte: since }, limit: 100 })) {
    if (sub.metadata.snap || (sub.metadata.w1 || "").startsWith("sent")) continue;
    const r = await sendFirstEmail(sub.id);
    if (r === "sent") out.sent++;
    if (r === "failed") out.failed++;
  }
  return NextResponse.json(out);
}
