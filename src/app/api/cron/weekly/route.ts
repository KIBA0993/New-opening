import { NextResponse } from "next/server";
import { composeDigest, packSnapshot, unpackSnapshot } from "@/lib/digest";
import { metadataToProfile, stripe } from "@/lib/billing";
import { env, has } from "@/lib/env";
import { renderDigestHtml, sendEmail } from "@/lib/email";

export const maxDuration = 300;

// Runs every Monday morning (see vercel.json). Sends each active subscriber their weekly email.
export async function GET(req: Request) {
  if (env.cronSecret && req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!has.stripe()) return NextResponse.json({ sent: 0, note: "Stripe isn't set up, so there are no subscribers yet." });

  let sent = 0;
  const failed: string[] = [];
  for await (const sub of stripe().subscriptions.list({ status: "active", limit: 100, expand: ["data.customer"] })) {
    const profile = metadataToProfile(sub.metadata as Record<string, string>);
    const customer = sub.customer as { email?: string | null };
    const to = profile?.email || customer?.email;
    if (!profile || !to) continue;
    try {
      const { digest, next } = await composeDigest(profile, unpackSnapshot(sub.metadata.snap));
      const html = renderDigestHtml(digest, {
        report: `${env.siteUrl}/report/${encodeURIComponent(profile.placeId)}?industry=${profile.industry}`,
      });
      await sendEmail(to, `${digest.business}: your 5-minute week`, html);
      await stripe().subscriptions.update(sub.id, { metadata: { snap: packSnapshot(next) } });
      sent++;
    } catch (e) {
      console.error("digest failed", sub.id, e);
      failed.push(sub.id);
    }
  }
  return NextResponse.json({ sent, failed });
}
