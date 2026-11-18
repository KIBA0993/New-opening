import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BuyerMapGrid } from "@/components/MapGrid";
import { DemoTag } from "@/components/ui";
import { applyTopup, CREDITS, getAccount } from "@/lib/credits";
import { ReCheck } from "./ReCheck";

export const metadata: Metadata = { title: "Your Autopilot", robots: { index: false } };

type SP = Promise<{ session_id?: string; topup?: string; added?: string }>;

export default async function AccountPage({ searchParams }: { searchParams: SP }) {
  const { session_id, topup, added } = await searchParams;
  const account = session_id ? await getAccount(session_id) : null;
  if (!account || !session_id) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-14">
        <h1 className="font-display text-[2.2rem]">We couldn&apos;t find that Autopilot</h1>
        <p className="mt-3 text-ink-2">Open this page from the link in your weekly email. If your subscription ended, you can restart it any time.</p>
        <Link href="/autopilot" className="btn btn-primary mt-6">See the Autopilot</Link>
      </div>
    );
  }
  const justAdded = (topup ? await applyTopup(topup, account) : false) || added === "1";
  const fromMonth = Math.max(0, account.allowance - account.used);
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="flex items-center gap-2">
        <p className="eyebrow">Weekly Autopilot</p>
        <DemoTag show={account.demo} />
      </div>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight sm:text-[2.6rem]">{account.profile.name}</h1>
      <p className="mt-2 text-ink-2">Your weekly email checks AI assistants every Monday. Want to see if a change worked sooner? Run a fresh check here.</p>

      {justAdded ? <p role="status" className="card mt-6 p-4 font-semibold text-good">Added {CREDITS.topupCount} re-checks. Thank you!</p> : null}

      <section className="card mt-6 p-5 sm:p-7">
        <ReCheck sessionId={session_id} initialLeft={account.left} topupLabel={`Add ${CREDITS.topupCount} more for $${CREDITS.topupPrice}`} />
        <p className="mt-5 text-[0.92rem] text-ink-3">
          {fromMonth} of {account.allowance} from this month&apos;s allowance{account.extra ? `, plus ${account.extra} extra` : ""}. Your allowance resets on {nextMonth}. Extra re-checks never expire.
        </p>
      </section>

      <Suspense fallback={null}>
        <BuyerMapGrid placeId={account.profile.placeId} industry={account.profile.industry} className="card mt-6 p-5 sm:p-7" />
      </Suspense>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/report/${encodeURIComponent(account.profile.placeId)}?industry=${account.profile.industry}`} className="btn btn-ghost">See your full check</Link>
        <Link href="/account" className="btn btn-ghost">Manage or cancel</Link>
      </div>
    </div>
  );
}
