import { after, NextResponse } from "next/server";
import type Stripe from "stripe";
import { alertOwner, errText } from "@/lib/alert";
import { stripe } from "@/lib/billing";
import { env } from "@/lib/env";
import { sendKitEmail } from "@/lib/fulfill";
import { sendFirstEmail } from "@/lib/welcome";

export const maxDuration = 300;

// Stripe events we act on (tick these in Stripe > Developers > Webhooks):
//   checkout.session.completed            send the Kit link / first Autopilot email right away
//   checkout.session.async_payment_failed a delayed payment (e.g. bank debit) didn't go through
//   invoice.payment_failed                an Autopilot renewal was declined
//   customer.subscription.updated         a subscription fell to past_due or unpaid
//   charge.dispute.created                a customer disputed a charge
// Every send is guarded by Stripe metadata, so this, the thank-you pages and the hourly
// check never send twice.
const money = (cents?: number | null, cur?: string | null) => (cents == null ? "" : `${(cents / 100).toFixed(2)} ${(cur || "usd").toUpperCase()}`);

export async function POST(req: Request) {
  if (!env.stripeWebhookSecret) return new NextResponse("Webhook not configured", { status: 503 });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), sig, env.stripeWebhookSecret);
  } catch (e) {
    // Usually a wrong STRIPE_WEBHOOK_SECRET, which would silently stop all fulfillment.
    await alertOwner("webhook-signature", "Stripe webhook signature check failed", { error: errText(e), hint: "Check STRIPE_WEBHOOK_SECRET in Vercel matches the endpoint's signing secret." });
    return new NextResponse("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        // Reply to Stripe right away; writing the email takes longer than Stripe waits.
        if (s.mode === "subscription" && subId) after(() => sendFirstEmail(subId, s.id).then(() => undefined));
        if (s.mode === "payment" && s.metadata?.product === "kit" && s.payment_status === "paid") after(() => sendKitEmail(s.id).then(() => undefined));
        break;
      }
      case "checkout.session.async_payment_failed": {
        const s = event.data.object;
        await alertOwner("async-failed", "A delayed payment failed", { business: s.metadata?.name, product: s.metadata?.product, customer: s.customer_details?.email, amount: money(s.amount_total, s.currency) });
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object;
        await alertOwner("renewal-failed", "An Autopilot payment was declined", {
          customer: inv.customer_email,
          amount: money(inv.amount_due, inv.currency),
          attempt: inv.attempt_count,
          "next retry": inv.next_payment_attempt ? new Date(inv.next_payment_attempt * 1000).toUTCString() : "none (Stripe gave up)",
          invoice: inv.hosted_invoice_url,
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const before = (event.data.previous_attributes as Partial<Stripe.Subscription> | undefined)?.status;
        if (before && before !== sub.status && (sub.status === "past_due" || sub.status === "unpaid")) {
          await alertOwner(`sub-${sub.status}`, `An Autopilot subscription is ${sub.status.replace("_", " ")}`, { business: sub.metadata?.name, subscription: sub.id });
        }
        break;
      }
      case "charge.dispute.created": {
        const d = event.data.object;
        await alertOwner("dispute", "A customer disputed a charge", { amount: money(d.amount, d.currency), reason: d.reason, charge: typeof d.charge === "string" ? d.charge : d.charge?.id });
        break;
      }
    }
  } catch (e) {
    await alertOwner("webhook-error", `Handling Stripe event ${event.type} failed`, { event: event.id, error: errText(e) });
    return new NextResponse("Handler error", { status: 500 }); // Stripe retries
  }
  return NextResponse.json({ received: true });
}
