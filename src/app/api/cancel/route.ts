import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import { env, has } from "@/lib/env";

// One-click cancel from the link in the Kit and Autopilot emails: opens Stripe's
// "cancel subscription" confirmation for this purchase directly, no sign-in needed.
// The private checkout session id in the link is the key, like the Kit link itself.
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id") || "";
  const fallback = new URL("/account", env.siteUrl);
  if (!has.stripe() || !sessionId.startsWith("cs_")) return NextResponse.redirect(fallback);
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId);
    const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
    const customer = typeof s.customer === "string" ? s.customer : s.customer?.id;
    if (!subId || !customer) return NextResponse.redirect(fallback);
    const sub = await stripe().subscriptions.retrieve(subId);
    const back = s.metadata?.product === "kit" ? `${env.siteUrl}/kit?session_id=${encodeURIComponent(sessionId)}` : env.siteUrl;
    const portal = await stripe().billingPortal.sessions.create({
      customer,
      return_url: back,
      // Already cancelled or ended: just show the portal instead of the cancel step.
      ...(["active", "trialing", "past_due"].includes(sub.status) && !sub.cancel_at_period_end
        ? { flow_data: { type: "subscription_cancel", subscription_cancel: { subscription: subId }, after_completion: { type: "redirect", redirect: { return_url: back } } } }
        : {}),
    });
    return NextResponse.redirect(portal.url);
  } catch (e) {
    console.error("cancel link", e);
    return NextResponse.redirect(fallback);
  }
}
