import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { paidSession, stripe } from "@/lib/billing";
import { composeDigest, packSnapshot } from "@/lib/digest";
import { env, has } from "@/lib/env";
import { renderDigestHtml, sendEmail } from "@/lib/email";

export const metadata: Metadata = { title: "Welcome to the Autopilot", robots: { index: false } };
export const maxDuration = 120;

export default async function Welcome({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const paid = session_id ? await paidSession(session_id) : null;
  if (!paid || !session_id) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-14">
        <h1 className="font-display text-[2.2rem]">We couldn&apos;t find that subscription</h1>
        <p className="mt-3 text-ink-2">If you just paid, check your email for a receipt from Stripe. Your first weekly email is on its way.</p>
      </div>
    );
  }

  // Send the first email right away, once, after the page has been returned.
  if (has.stripe() && !session_id.startsWith("demo_")) {
    after(async () => {
      try {
        const s = await stripe().checkout.sessions.retrieve(session_id);
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (!subId) return;
        const sub = await stripe().subscriptions.retrieve(subId);
        if (sub.metadata.snap) return; // already sent
        const { digest, next } = await composeDigest(paid.profile, null);
        await sendEmail(paid.profile.email, `${digest.business}: your first 5-minute week`, renderDigestHtml(digest));
        await stripe().subscriptions.update(subId, { metadata: { snap: packSnapshot(next) } });
      } catch (e) {
        console.error("welcome digest", e);
      }
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-14">
      <p className="eyebrow">You&apos;re in</p>
      <h1 className="font-display mt-2 text-[2.4rem] leading-tight">Your first weekly email is on its way.</h1>
      <p className="mt-4 text-ink-2">
        We&apos;re checking ChatGPT, Perplexity and Gemini for {paid.profile.name} now, and looking at your rivals and events near you. Look for it in {paid.profile.email} in the next few minutes. After that, it arrives every Monday morning.
      </p>
      <p className="mt-4 text-ink-2">Not seeing it? Check your promotions or spam folder and mark it as safe.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/report/${encodeURIComponent(paid.profile.placeId)}?industry=${paid.profile.industry}`} className="btn btn-primary">See your free check</Link>
        <Link href={`${env.siteUrl}/account`} className="btn btn-ghost">Manage subscription</Link>
      </div>
    </div>
  );
}
