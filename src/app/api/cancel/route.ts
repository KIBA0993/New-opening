import { NextResponse } from "next/server";
import { alertOwner, errText } from "@/lib/alert";
import { stripe } from "@/lib/billing";
import { env, has } from "@/lib/env";
import { allowIp } from "@/lib/guard";

// One-click cancel from the link in the Kit and Autopilot emails: opens Stripe's
// "cancel subscription" confirmation for this purchase directly, no sign-in needed.
// The private checkout session id in the link is the key, like the Kit link itself.
// If Stripe's portal can't open, the owner lands on /cancel, which cancels without it (POST below).

const LIVE = ["active", "trialing", "past_due"];

async function subscriptionFor(sessionId: string) {
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
  const customer = typeof s.customer === "string" ? s.customer : s.customer?.id;
  return { s, subId, customer };
}

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id") || "";
  const fallback = new URL("/account", env.siteUrl);
  if (!has.stripe() || !sessionId.startsWith("cs_")) return NextResponse.redirect(fallback);
  let subId: string | undefined;
  try {
    const found = await subscriptionFor(sessionId);
    subId = found.subId;
    if (!found.subId || !found.customer) return NextResponse.redirect(fallback);
    const sub = await stripe().subscriptions.retrieve(found.subId);
    const back = found.s.metadata?.product === "kit" ? `${env.siteUrl}/kit?session_id=${encodeURIComponent(sessionId)}` : env.siteUrl;
    const portal = await stripe().billingPortal.sessions.create({
      customer: found.customer,
      return_url: back,
      // Already cancelled or ended: just show the portal instead of the cancel step.
      ...(LIVE.includes(sub.status) && !sub.cancel_at_period_end
        ? { flow_data: { type: "subscription_cancel", subscription_cancel: { subscription: found.subId }, after_completion: { type: "redirect", redirect: { return_url: back } } } }
        : {}),
    });
    return NextResponse.redirect(portal.url);
  } catch (e) {
    // Usually Stripe's customer portal isn't set up in live mode. The owner still gets a working cancel button.
    await alertOwner("cancel-portal", "A customer's cancel link couldn't open Stripe's portal", {
      subscription: subId,
      error: errText(e),
      hint: "Stripe > Settings > Billing > Customer portal: save it in live mode and allow cancelling. The customer was shown MapDebut's own cancel button instead.",
    });
    return NextResponse.redirect(new URL(`/cancel?session_id=${encodeURIComponent(sessionId)}`, env.siteUrl));
  }
}

// The /cancel page's button: stops the Autopilot at the end of the period already paid for
// (for a Kit's free week, before the first charge).
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const sessionId = String(form?.get("session_id") || "");
  const page = (state: string) => NextResponse.redirect(new URL(`/cancel?session_id=${encodeURIComponent(sessionId)}&${state}=1`, env.siteUrl), 303);
  if (!(await allowIp("cancel", 10, 600))) return page("error");
  if (!has.stripe() || !sessionId.startsWith("cs_")) return page("error");
  let subId: string | undefined;
  try {
    const found = await subscriptionFor(sessionId);
    subId = found.subId;
    if (!found.subId) return page("error");
    const sub = await stripe().subscriptions.retrieve(found.subId);
    if (LIVE.includes(sub.status) && !sub.cancel_at_period_end) {
      await stripe().subscriptions.update(found.subId, { cancel_at_period_end: true, metadata: { cancelled_via: "mapdebut-cancel-page" } });
    }
    return page("done");
  } catch (e) {
    await alertOwner("cancel-failed", "A customer tried to cancel and it failed. Cancel it for them in Stripe.", { subscription: subId, session: sessionId, error: errText(e) });
    return page("error");
  }
}
