import "server-only";
import { metadataToProfile, stripe } from "./billing";
import { composeDigest, packSnapshot } from "./digest";
import { env } from "./env";
import { renderDigestHtml, sendEmail } from "./email";

// The first Autopilot email goes out right after purchase. The thank-you page triggers it,
// and an hourly job catches anyone who closed the tab before reaching that page.
// Subscription metadata `w1` holds when the first email was claimed or sent, so it goes once.

const CLAIM_MS = 15 * 60_000; // a send in progress blocks others for 15 minutes

export async function sendFirstEmail(subId: string, sessionId?: string): Promise<"sent" | "skipped" | "failed"> {
  const sub = await stripe().subscriptions.retrieve(subId, { expand: ["customer"] });
  if (!["active", "trialing"].includes(sub.status)) return "skipped";
  const m = sub.metadata;
  if (m.snap) return "skipped"; // a weekly email already went out
  if (m.w1 && (m.w1.startsWith("sent") || Date.now() - Number(m.w1) < CLAIM_MS)) return "skipped";
  const profile = metadataToProfile(m as Record<string, string>);
  const to = profile?.email || (sub.customer as { email?: string | null })?.email;
  if (!profile || !to) return "skipped";

  await stripe().subscriptions.update(subId, { metadata: { w1: String(Date.now()) } });
  try {
    const sid = sessionId || (await stripe().checkout.sessions.list({ subscription: subId, limit: 1 })).data[0]?.id;
    const { digest, next } = await composeDigest(profile, null);
    const html = renderDigestHtml(digest, {
      report: `${env.siteUrl}/report/${encodeURIComponent(profile.placeId)}?industry=${profile.industry}`,
      account: sid ? `${env.siteUrl}/autopilot/account?session_id=${sid}` : undefined,
    });
    const res = await sendEmail(to, `${digest.business}: your first 5-minute week`, html);
    if (!res.ok) throw new Error("email not accepted");
    await stripe().subscriptions.update(subId, { metadata: { snap: packSnapshot(next), w1: `sent:${Date.now()}` } });
    return "sent";
  } catch (e) {
    console.error("first email", subId, e);
    await stripe().subscriptions.update(subId, { metadata: { w1: "" } }).catch(() => undefined);
    return "failed";
  }
}

/** True when the first email went out in the last 3 days, so Monday's email can wait a week. */
export function firstEmailJustSent(meta: Record<string, string>) {
  const t = Number((meta.w1 || "").replace("sent:", ""));
  return (meta.w1 || "").startsWith("sent:") && Date.now() - t < 3 * 864e5;
}
