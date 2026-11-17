import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-12 [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-[1.4rem] [&_p]:mt-3 [&_p]:text-ink-2">
      <h1 className="font-display text-[2.4rem]">Privacy</h1>
      <p>Last updated November 17, 2026.</p>
      <h2>What we collect</h2>
      <p>Your business name and public listing details from Google, the answers you give us about your business, and your email address. Payments are handled by Stripe. We never see your card details.</p>
      <h2>How we use it</h2>
      <p>To run your free check, write your Launch Kit, and send your weekly email. To do that, we send your business details (never your email) to AI providers such as OpenAI, Perplexity and Google, and to data providers such as Google Places, DataForSEO and PredictHQ.</p>
      <h2>What we don't do</h2>
      <p>We don't sell your data, and we never sign in to your Google, Yelp or other accounts.</p>
      <h2>Your choices</h2>
      <p>Unsubscribe from any email with one click. To delete your data, reply to any of our emails.</p>
    </article>
  );
}
