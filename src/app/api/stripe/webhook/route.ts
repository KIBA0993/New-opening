import { after, NextResponse } from "next/server";
import type Stripe from "stripe";
import { alertOwner, errText } from "@/lib/alert";
import { stripe } from "@/lib/billing";
import { env } from "@/lib/env";
import { sendKitEmail } from "@/lib/fulfill";
import { sendFirstEmail } from "@/lib/welcome";
import { recordEvent } from "@/lib/stats";
import { nameSource, type Channel } from "@/lib/sources";

export const maxDuration = 300;

// Stripe events we act on (tick these in Stripe > Developers > Webhooks):
//   checkout.session.completed            send the Kit link / first Autopilot email right away
//   checkout.session.async_payment_failed a delayed payment (e.g. bank debit) didn't go through
//   invoice.payment_failed                an Autopilot renewal was declined
//   customer.subscription.updated         a subscription fell to past_due or unpaid
//   charge.dispute.created                a customer disputed a charge
//   charge.refunded                       a refund: ends a Kit buyer's free Autopilot week so it never bills
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
        // Test-mode payments and the owner's own test buys don't count as sales by source.
        const counted = s.livemode && s.metadata?.src !== "owner";
        const [srcName, srcChannel] = (s.metadata?.src || "").split("|");
        const source = srcName && srcChannel ? { name: srcName, channel: srcChannel as Channel } : nameSource(null);
        if (counted && s.payment_status === "paid" && s.mode === "subscription" && s.metadata?.product !== "kit") await recordEvent("autopilot_paid", source);
        if (counted && s.payment_status === "paid" && s.metadata?.product === "kit") await recordEvent("kit_paid", source);
        if (s.mode === "subscription" && subId) after(() => sendFirstEmail(subId, s.id).then(() => undefined));
        // A Kit can be a one-time payment, or (with the free Autopilot week) a subscription checkout.
        if (s.metadata?.product === "kit" && s.payment_status === "paid") after(() => sendKitEmail(s.id).then(() => undefined));
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
      case "charge.refunded": {
        const c = event.data.object;
        const customer = typeof c.customer === "string" ? c.customer : c.customer?.id;
        const ended = c.refunded && customer ? await endRefundedKitTrials(customer, c.amount) : [];
        await alertOwner(`refund-${c.id}`, ended.length ? "A Kit was refunded: its free Autopilot week was cancelled" : "A payment was refunded", {
          customer: c.billing_details?.email || c.receipt_email,
          amount: money(c.amount_refunded, c.currency),
          "full refund": c.refunded ? "yes" : "no (partial)",
          "Autopilot cancelled": ended.join(", ") || "none",
          hint: ended.length ? "" : "If this was an Autopilot payment and they want out, cancel the subscription in Stripe too.",
        });
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

/**
 * A Kit bought with the free Autopilot week is one subscription: refunding the Kit payment
 * doesn't stop it, so it would bill the monthly price when the week ends. This cancels the
 * customer's trialing Kit subscriptions whose first invoice is the refunded amount.
 */
async function endRefundedKitTrials(customer: string, amount: number): Promise<string[]> {
  const ended: string[] = [];
  for await (const sub of stripe().subscriptions.list({ customer, status: "trialing", limit: 20, expand: ["data.latest_invoice"] })) {
    if (sub.metadata?.product !== "kit") continue;
    const inv = sub.latest_invoice && typeof sub.latest_invoice !== "string" ? sub.latest_invoice : null;
    if (!inv || inv.amount_paid !== amount) continue;
    await stripe().subscriptions.cancel(sub.id);
    ended.push(sub.id);
  }
  return ended;
}
