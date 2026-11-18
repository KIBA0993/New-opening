import { after, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing";
import { env } from "@/lib/env";
import { sendFirstEmail } from "@/lib/welcome";

export const maxDuration = 300;

// Backup for the first Autopilot email: Stripe calls this the moment a checkout completes,
// even if the buyer closes the tab. sendFirstEmail checks the subscription's "snap" and "w1"
// metadata, so the thank-you page, this webhook and the hourly job never double-send.
export async function POST(req: Request) {
  if (!env.stripeWebhookSecret) return new NextResponse("Webhook not configured", { status: 503 });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), sig, env.stripeWebhookSecret);
  } catch {
    return new NextResponse("Bad signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
    if (s.mode === "subscription" && subId) {
      // Reply to Stripe right away; writing the email takes longer than Stripe waits.
      after(() => sendFirstEmail(subId, s.id).catch((e) => console.error("webhook first email", e)));
    }
  }
  return NextResponse.json({ received: true });
}
