import "server-only";
import { alertOwner, errText } from "./alert";
import { paidSession, stripe } from "./billing";
import { renderKitEmail, sendEmail } from "./email";
import { env } from "./env";

/**
 * Emails the Launch Kit link once per purchase (flag: payment intent metadata kit_emailed).
 * Called from the kit page, the Stripe webhook and the hourly check, so a buyer who closes
 * the tab still gets their link.
 */
export async function sendKitEmail(sessionId: string): Promise<"sent" | "skipped" | "failed"> {
  let business = "";
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId);
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    if (!pi || s.metadata?.product !== "kit") return "skipped";
    const intent = await stripe().paymentIntents.retrieve(pi);
    if (intent.metadata.kit_emailed) return "skipped";
    const paid = await paidSession(sessionId);
    if (!paid) return "skipped";
    business = paid.profile.name;
    const to = paid.profile.email;
    if (!to) throw new Error("No email on the purchase");
    // Claim first so two callers at once can't both send.
    await stripe().paymentIntents.update(pi, { metadata: { kit_emailed: "1" } });
    const res = await sendEmail(to, `Your Launch Kit for ${business}`, renderKitEmail(business, `${env.siteUrl}/kit?session_id=${sessionId}`));
    if (!res.ok) {
      await stripe().paymentIntents.update(pi, { metadata: { kit_emailed: "" } });
      throw new Error("Email provider didn't accept it");
    }
    return "sent";
  } catch (e) {
    await alertOwner("kit-email", "A Launch Kit buyer's link email failed", { business, session: sessionId, error: errText(e) });
    return "failed";
  }
}
