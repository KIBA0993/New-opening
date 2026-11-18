import { NextResponse } from "next/server";
import { alertOwner } from "@/lib/alert";
import { stripe } from "@/lib/billing";
import { env, has } from "@/lib/env";
import { sendKitEmail } from "@/lib/fulfill";
import { sendFirstEmail } from "@/lib/welcome";

export const maxDuration = 300;

// Runs hourly (see vercel.json). Safety net for fulfillment: any Kit buyer or new Autopilot
// subscriber from the last 3 days who hasn't had their email yet gets it now, and the owner
// is alerted if it still fails.
const GRACE_SEC = 15 * 60; // give the webhook and thank-you pages time first

export async function GET(req: Request) {
  if (env.cronSecret && req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!has.stripe()) return NextResponse.json({ sent: 0 });
  const now = Math.floor(Date.now() / 1000);
  const since = now - 3 * 86400;
  const out = { autopilot: 0, kit: 0, failed: 0 };

  for await (const sub of stripe().subscriptions.list({ status: "all", created: { gte: since }, limit: 100 })) {
    if (sub.status !== "active" && sub.status !== "trialing") continue;
    if (sub.metadata.snap || (sub.metadata.w1 || "").startsWith("sent")) continue;
    if (now - sub.created < GRACE_SEC) continue;
    const r = await sendFirstEmail(sub.id);
    if (r === "sent") out.autopilot++;
    if (r === "failed") out.failed++;
  }

  for await (const s of stripe().checkout.sessions.list({ created: { gte: since }, status: "complete", limit: 100 })) {
    if (s.metadata?.product !== "kit" || s.payment_status !== "paid" || now - s.created < GRACE_SEC) continue;
    const r = await sendKitEmail(s.id);
    if (r === "sent") out.kit++;
    if (r === "failed") out.failed++;
  }

  if (out.autopilot + out.kit > 0) {
    await alertOwner("caught-up", "Some buyers only got their email from the hourly check", { ...out, hint: "Usually means the Stripe webhook isn't set up or is failing." });
  }
  return NextResponse.json(out);
}
