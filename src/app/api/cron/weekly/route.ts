import { NextResponse } from "next/server";
import { composeDigest, packSnapshot, unpackSnapshot } from "@/lib/digest";
import { metadataToProfile, stripe } from "@/lib/billing";
import { env, has } from "@/lib/env";
import { renderDigestHtml, sendEmail } from "@/lib/email";
import { firstEmailJustSent, trialNotice } from "@/lib/welcome";
import { cronAllowed, weekKey } from "@/lib/cron";
import { alertOwner } from "@/lib/alert";
import { kitBlock, applyKitPost } from "@/lib/kitDigest";

export const maxDuration = 300;

// Runs every Monday morning (see vercel.json). Sends each active subscriber their weekly email.
export async function GET(req: Request) {
  if (!cronAllowed(req)) return new NextResponse("Unauthorized", { status: 401 });
  if (!has.stripe()) return NextResponse.json({ sent: 0, note: "Stripe isn't set up, so there are no subscribers yet." });

  const week = weekKey();
  let sent = 0;
  const failed: string[] = [];
  for await (const sub of stripe().subscriptions.list({ status: "all", limit: 100, expand: ["data.customer"] })) {
    if (sub.status !== "active" && sub.status !== "trialing") continue; // trialing = a Kit buyer's free week
    const profile = metadataToProfile(sub.metadata as Record<string, string>);
    const customer = sub.customer as { email?: string | null };
    const to = profile?.email || customer?.email;
    if (!profile || !to) continue;
    if (firstEmailJustSent(sub.metadata as Record<string, string>)) continue; // their first email went out in the last 3 days
    if (sub.metadata.wk === week) continue; // already sent (or being sent) this week: a second run never doubles up
    try {
      // Claim this week before writing, so two runs at once can't both send.
      await stripe().subscriptions.update(sub.id, { metadata: { wk: week } });
      const { digest, next } = await composeDigest(profile, unpackSnapshot(sub.metadata.snap));
      const checkout = (await stripe().checkout.sessions.list({ subscription: sub.id, limit: 1 })).data[0];
      const kit = await kitBlock(checkout, profile, { check: true }).catch(() => null);
      await applyKitPost(digest, kit, checkout?.id, profile);
      const html = renderDigestHtml(digest, {
        kitProgress: kit,
        report: `${env.siteUrl}/report/${encodeURIComponent(profile.placeId)}?industry=${profile.industry}`,
        account: checkout ? `${env.siteUrl}/autopilot/account?session_id=${checkout.id}` : undefined,
        trial: trialNotice(sub, checkout?.id),
      });
      const res = await sendEmail(to, `${digest.business}: your 5-minute week`, html);
      if (!res.ok) throw new Error("email not accepted");
      await stripe().subscriptions.update(sub.id, { metadata: { snap: packSnapshot(next) } });
      sent++;
    } catch (e) {
      console.error("digest failed", sub.id, e);
      failed.push(sub.id);
      await stripe().subscriptions.update(sub.id, { metadata: { wk: "" } }).catch(() => undefined); // let a re-run retry it
    }
  }
  if (failed.length) await alertOwner("weekly", `${failed.length} weekly Autopilot emails failed`, { sent, failed: failed.join(", ") });
  return NextResponse.json({ sent, failed });
}
