import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { Suspense } from "react";
import { BuyerMapGrid } from "@/components/MapGrid";
import { kitTrial, paidSession } from "@/lib/billing";
import { has, PRICES } from "@/lib/env";
import { sendKitEmail } from "@/lib/fulfill";
import { industryBySlug } from "@/lib/industries";
import { AI_ROBOTS, businessSchema, writeKit } from "@/lib/kit";
import { directoriesFor } from "@/lib/directories";
import { GUIDES } from "@/lib/platforms";
import { reviewLink } from "@/lib/providers/places";
import { KitView } from "./KitView";

export const metadata: Metadata = { title: "Your Launch Kit", robots: { index: false } };
export const maxDuration = 300; // writing the kit with Claude can take a while on first open

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
  const [kit, trial] = await Promise.all([writeKit(session_id, profile), kitTrial(session_id)]);
  const industry = industryBySlug(profile.industry)!;

  // Email the kit link once, so the owner can always get back here.
  if (has.stripe() && !session_id.startsWith("demo_")) after(() => sendKitEmail(session_id));

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
      directories={directoriesFor(profile.industry)}
      schema={businessSchema(profile, kit, industry.serviceArea)}
      robots={AI_ROBOTS}
      autopilot={{
        trial,
        accountUrl: `/autopilot/account?session_id=${encodeURIComponent(session_id)}`,
        monthly: PRICES.monthly.label,
        yearly: PRICES.yearly.label,
        save: PRICES.yearly.save,
      }}
    />
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <Suspense fallback={null}>
        <BuyerMapGrid placeId={profile.placeId} industry={profile.industry} className="card mt-12 p-5 sm:p-7" />
      </Suspense>
    </div>
    </>
  );
}
