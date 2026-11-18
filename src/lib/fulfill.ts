import "server-only";
import { alertOwner, errText } from "./alert";
import { kitTrial, paidSession, stripe } from "./billing";
import { renderKitEmail, sendEmail } from "./email";
import { env } from "./env";

/**
 * Emails the Launch Kit link once per purchase. The "kit_emailed" flag lives on the payment
 * intent (Kit only) or on the subscription (Kit with the free Autopilot week).
 * Called from the kit page, the Stripe webhook and the hourly check, so a buyer who closes
 * the tab still gets their link.
 */
export async function sendKitEmail(sessionId: string): Promise<"sent" | "skipped" | "failed"> {
  let business = "";
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId);
    if (s.metadata?.product !== "kit") return "skipped";
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
    const flag = pi
      ? {
          get: async () => (await stripe().paymentIntents.retrieve(pi)).metadata.kit_emailed,
          set: (v: string) => stripe().paymentIntents.update(pi, { metadata: { kit_emailed: v } }),
        }
      : subId
        ? {
            get: async () => (await stripe().subscriptions.retrieve(subId)).metadata.kit_emailed,
            set: (v: string) => stripe().subscriptions.update(subId, { metadata: { kit_emailed: v } }),
          }
        : null;
    if (!flag || (await flag.get())) return "skipped";
    const paid = await paidSession(sessionId);
    if (!paid) return "skipped";
    business = paid.profile.name;
    const to = paid.profile.email;
    if (!to) throw new Error("No email on the purchase");
    // Claim first so two callers at once can't both send.
    await flag.set("1");
    const trial = subId ? await kitTrial(sessionId) : null;
    const res = await sendEmail(to, `Your Launch Kit for ${business}`, renderKitEmail(business, `${env.siteUrl}/kit?session_id=${sessionId}`, trial));
    if (!res.ok) {
      await flag.set("");
      throw new Error("Email provider didn't accept it");
    }
    return "sent";
  } catch (e) {
    await alertOwner("kit-email", "A Launch Kit buyer's link email failed", { business, session: sessionId, error: errText(e) });
    return "failed";
  }
}
