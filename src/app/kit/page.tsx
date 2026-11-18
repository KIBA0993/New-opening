import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BuyerMapGrid } from "@/components/MapGrid";
import { paidSession, stripe } from "@/lib/billing";
import { env, has } from "@/lib/env";
import { renderKitEmail, sendEmail } from "@/lib/email";
import { industryBySlug } from "@/lib/industries";
import { writeKit } from "@/lib/kit";
import { GUIDES } from "@/lib/platforms";
import { reviewLink } from "@/lib/providers/places";
import { KitView } from "./KitView";

export const metadata: Metadata = { title: "Your Launch Kit", robots: { index: false } };
export const maxDuration = 60;

export default async function KitPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const paid = session_id ? await paidSession(session_id) : null;

  if (!paid || !session_id) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-14">
        <h1 className="font-display text-[2.2rem] leading-tight">We couldn&apos;t open this kit</h1>
        <p className="mt-3 text-ink-2">
          Use the link in the email we sent after you paid. If you can&apos;t find it, reply to that email and we&apos;ll send it again.
        </p>
        <Link href="/start" className="btn btn-primary mt-6">Run a free check</Link>
      </div>
    );
  }

  const { profile } = paid;
  const kit = await writeKit(session_id, profile);
  const industry = industryBySlug(profile.industry)!;

  // Email the kit link once, so the owner can always get back here.
  if (has.stripe() && !session_id.startsWith("demo_")) {
    try {
      const s = await stripe().checkout.sessions.retrieve(session_id);
      const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
      if (pi) {
        const intent = await stripe().paymentIntents.retrieve(pi);
        if (!intent.metadata.kit_emailed) {
          if (profile.email) await sendEmail(profile.email, `Your Launch Kit for ${profile.name}`, renderKitEmail(profile.name, `${env.siteUrl}/kit?session_id=${session_id}`));
          await stripe().paymentIntents.update(pi, { metadata: { kit_emailed: "1" } });
        }
      }
    } catch (e) {
      console.error("kit email", e);
    }
  }

  return (
    <>
    <KitView
      kit={kit}
      profile={profile}
      guides={GUIDES}
      reviewUrl={reviewLink(profile.placeId)}
      serviceArea={industry.serviceArea}
      storeKey={session_id}
      industryName={industry.name}
    />
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <Suspense fallback={null}>
        <BuyerMapGrid placeId={profile.placeId} industry={profile.industry} className="card mt-12 p-5 sm:p-7" />
      </Suspense>
    </div>
    </>
  );
}
