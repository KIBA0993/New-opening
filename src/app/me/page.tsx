import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { currentEmail } from "@/lib/auth";
import { purchasesFor, type Purchase } from "@/lib/billing";
import { creditsLeft } from "@/lib/credits";
import { has } from "@/lib/env";
import { loadProgress } from "@/lib/kitCheck";
import { doneCount, nextStep, STEP_IDS, STEP_TITLE } from "@/lib/kitSteps";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const day = (sec?: number | null) => (sec ? new Date(sec * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");

/** One business: its Launch Kit and its Autopilot (bought with the Kit's free week, or on its own). */
interface Business {
  placeId: string;
  name: string;
  industry: string;
  kit?: Purchase;
  autopilot?: Purchase; // the purchase whose checkout created the subscription
}

function group(purchases: Purchase[]): Business[] {
  const out = new Map<string, Business>();
  for (const p of purchases) {
    const id = p.placeId || p.business;
    const b = out.get(id) || { placeId: p.placeId, name: p.business, industry: p.industry };
    out.set(id, b);
    // Purchases come newest first, so the first one of each kind wins.
    if (p.product === "kit" && !b.kit) b.kit = p;
    if (p.subscription && !b.autopilot) b.autopilot = p;
  }
  return [...out.values()];
}

function plan(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  const cents = item?.price?.unit_amount;
  const per = item?.price?.recurring?.interval === "year" ? "year" : "month";
  return cents ? `$${Math.round(cents / 100)}/${per}` : `per ${per}`;
}

function AutopilotStatus({ sub }: { sub: Stripe.Subscription }) {
  const price = plan(sub);
  const ends = day(sub.items.data[0]?.current_period_end);
  if (sub.status === "trialing" && sub.cancel_at_period_end) return <>Free week, cancelled. It ends on {day(sub.trial_end)} and you won&apos;t be charged.</>;
  if (sub.status === "trialing") return <>Free week until {day(sub.trial_end)}, then {price} until you cancel.</>;
  if (sub.cancel_at_period_end) return <>Cancelled. Your emails keep coming until {ends}.</>;
  if (sub.status === "active") return <>Active, {price}. Renews on {ends}.</>;
  if (sub.status === "past_due" || sub.status === "unpaid") return <span className="text-bad">Your last payment didn&apos;t go through. Update your card under Billing and receipts.</span>;
  return <>Ended.</>;
}

async function KitRow({ kit }: { kit: Purchase }) {
  const progress = await loadProgress(kit.sessionId);
  const done = doneCount(progress);
  const next = nextStep(progress);
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">Launch Kit</p>
        <p className="text-[0.92rem] text-ink-3">
          {done} of {STEP_IDS.length} steps done{next ? ` · Next: ${STEP_TITLE[next]}` : " · All set"}
        </p>
      </div>
      <Link href={`/kit?session_id=${kit.sessionId}`} className="btn btn-primary">Open Launch Kit</Link>
    </div>
  );
}

function AutopilotRow({ p }: { p: Purchase }) {
  const sub = p.subscription!;
  const live = ["active", "trialing", "past_due"].includes(sub.status);
  const account = `/autopilot/account?session_id=${p.sessionId}`;
  return (
    <div className="border-t border-line pt-4">
      <p className="font-semibold">Weekly Autopilot</p>
      <p className="text-[0.92rem] text-ink-3"><AutopilotStatus sub={sub} /></p>
      {live ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${account}#this-week`} className="btn btn-primary">This week&apos;s email</Link>
          <Link href={account} className="btn btn-ghost">Re-checks ({creditsLeft(sub)} left)</Link>
          {!sub.cancel_at_period_end ? (
            <a href={`/api/cancel?session_id=${encodeURIComponent(p.sessionId)}`} className="btn btn-ghost">Cancel</a>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${account}#this-week`} className="btn btn-ghost">Past emails</Link>
          <Link href="/autopilot" className="btn btn-ghost">Restart</Link>
        </div>
      )}
    </div>
  );
}

export default async function Me() {
  const email = await currentEmail();
  if (!email) redirect("/signin?next=/me");
  const purchases = await purchasesFor(email).catch((e) => {
    console.error("purchases", e);
    return [] as Purchase[];
  });
  const businesses = group(purchases);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="eyebrow">Your account</p>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight">Welcome back</h1>
      <p className="mt-1 text-ink-3">Signed in as {email}</p>

      {businesses.length ? (
        <ul className="mt-8 space-y-4">
          {businesses.map((b) => (
            <li key={b.placeId || b.name} className="card space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-[1.5rem] leading-tight">{b.name}</h2>
                {b.placeId ? (
                  <Link href={`/report/${encodeURIComponent(b.placeId)}${b.industry ? `?industry=${b.industry}` : ""}`} className="link text-[0.92rem]">See your check</Link>
                ) : null}
              </div>
              {b.kit ? <KitRow kit={b.kit} /> : null}
              {b.autopilot ? (
                <AutopilotRow p={b.autopilot} />
              ) : b.kit ? (
                <div className="border-t border-line pt-4">
                  <p className="font-semibold">Weekly Autopilot</p>
                  <p className="text-[0.92rem] text-ink-3">Not on yet. One email every Monday: AI check, rival moves, a Google post and review replies written for you.</p>
                  <Link href="/autopilot" className="btn btn-ghost mt-3">See the Autopilot</Link>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-8 p-6">
          <p className="font-display text-[1.4rem]">Nothing here yet</p>
          <p className="mt-2 text-ink-2">
            {has.stripe()
              ? "We couldn't find a Launch Kit or Autopilot bought with this email. If you paid with a different email, sign out and use that one."
              : "Sample mode: purchases show up here once payments are turned on."}
          </p>
          <Link href="/start" className="btn btn-primary mt-5">Run a free check</Link>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/account" className="btn btn-ghost">Billing and receipts</Link>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="btn btn-ghost">Sign out</button>
        </form>
      </div>
    </div>
  );
}
