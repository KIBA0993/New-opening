import { CONTACT_EMAIL, REFUND_DAYS } from "@/lib/site";
import type { Metadata } from "next";
import { DEAL, dealEndLabel, KIT_TRIAL_DAYS } from "@/lib/deal";
export const metadata: Metadata = { title: "Terms" };
export default function Terms() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-12 [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-[1.4rem] [&_p]:mt-3 [&_p]:text-ink-2">
      <h1 className="font-display text-[2.4rem]">Terms</h1>
      <p>Last updated November 18, 2026.</p>
      <h2>What you're buying</h2>
      <p>MapDebut is self-serve software. The Launch Kit is written content and step-by-step guides you use to set up your own profiles. The Weekly Autopilot is an automated weekly email. We don't create, edit or manage profiles on your behalf.</p>
      <h2>No guarantees on rankings</h2>
      <p>Google, Apple, Yelp, Bing, Facebook and OpenAI decide who they show and recommend. We can't guarantee placement, verification or recommendations.</p>
      <h2>Subscriptions</h2>
      <p>The Autopilot renews monthly or yearly until you cancel. Cancel any time from the link in every email, and it stops at the end of the period you paid for.</p>
      <p>The Launch Kit includes the first {KIT_TRIAL_DAYS} days of the Weekly Autopilot free. Unless you cancel before the free period ends, it then renews at the monthly Autopilot price shown at checkout, charged to the card you paid with, every month until you cancel. We show the renewal date and price at checkout and in your Kit email, along with a one-click cancel link. Cancelling the Autopilot never affects your Launch Kit. You can also buy the Kit on its own, without the Autopilot.</p>
      <h2>Launch deal</h2>
      <p>Launch prices apply to purchases made by {dealEndLabel()}, 2026, 11:59 PM Pacific. After that, the Launch Kit is ${DEAL.kitAfter} and new Autopilot plans are ${DEAL.monthlyAfter} a month or ${DEAL.yearlyAfter} a year. If you subscribe during the launch deal, you keep your launch price for as long as your subscription stays active.</p>
      <h2>14-day money-back promise</h2>
      <p>If MapDebut isn&apos;t right for you, email {CONTACT_EMAIL} within {REFUND_DAYS} days of paying and we&apos;ll refund that payment in full. This covers the Launch Kit and your first Autopilot payment.</p>
      <h2>Contact</h2>
      <p>Questions or problems: {CONTACT_EMAIL}.</p>
      <h2>Your content</h2>
      <p>Everything we write for you is yours to use. Please check it before you publish it.</p>
    </article>
  );
}
