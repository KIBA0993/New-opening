import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms" };
export default function Terms() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-12 [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-[1.4rem] [&_p]:mt-3 [&_p]:text-ink-2">
      <h1 className="font-display text-[2.4rem]">Terms</h1>
      <p>Last updated November 17, 2026.</p>
      <h2>What you're buying</h2>
      <p>Opening Day is self-serve software. The Launch Kit is written content and step-by-step guides you use to set up your own profiles. The Weekly Autopilot is an automated weekly email. We don't create, edit or manage profiles on your behalf.</p>
      <h2>No guarantees on rankings</h2>
      <p>Google, Apple, Yelp, Bing, Facebook and OpenAI decide who they show and recommend. We can't guarantee placement, verification or recommendations.</p>
      <h2>Subscriptions</h2>
      <p>The Autopilot renews monthly or yearly until you cancel. Cancel any time from the link in every email, and it stops at the end of the period you paid for.</p>
      <h2>Your content</h2>
      <p>Everything we write for you is yours to use. Please check it before you publish it.</p>
    </article>
  );
}
