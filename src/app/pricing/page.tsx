import type { Metadata } from "next";
import Link from "next/link";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { CostCompare, Faq, KitContents, Pricing } from "@/components/marketing";
import { Section } from "@/components/ui";
import { COMPARISONS } from "@/lib/compare";
import { DEAL, dealEndLabel, dealOn, KIT_TRIAL_DAYS } from "@/lib/deal";
import { kitPrice } from "@/lib/pricing";
import { autopilotOffersLd, kitOfferLd, priceFacts } from "@/lib/priceFacts";
import { CONTACT_EMAIL, REFUND_DAYS, SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300; // kit price moves with sales

export const metadata: Metadata = {
  title: "Pricing: free check, one-time Launch Kit, optional weekly Autopilot",
  description:
    "What MapDebut costs: a free AI visibility check, a one-time Launch Kit that writes every profile for a new local business, and an optional weekly email. 14-day money-back promise.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const kit = await kitPrice();
  const deal = dealOn();
  const prices = priceFacts(kit.amount);
  const faqs = [
    { q: "How much does MapDebut cost?", a: prices.sentence },
    {
      q: "Is the Launch Kit a subscription?",
      a: `No. You pay once and keep everything.${KIT_TRIAL_DAYS > 0 ? ` You can add a free ${KIT_TRIAL_DAYS}-day Autopilot trial at checkout, and it only continues if you keep it.` : ""}`,
    },
    {
      q: "Why does the Launch Kit price go up?",
      a: deal
        ? `It's a launch price: it rises a step after every few sales, and the deal ends ${dealEndLabel()}, after which it's $${DEAL.kitAfter}. The price you see at checkout is the price you pay.`
        : `The launch deal has ended. The Launch Kit is $${DEAL.kitAfter}.`,
    },
    {
      q: "Can I get a refund?",
      a: `Yes. Email ${CONTACT_EMAIL} within ${REFUND_DAYS} days of paying for a full refund. That covers the Launch Kit and your first Autopilot payment.`,
    },
    {
      q: "Do I need to pay for Google, Yelp or the others?",
      a: "No. Google Business Profile, Apple Business Connect, Bing Places, Yelp, Facebook and ChatGPT's Business Hub are free. MapDebut writes what goes in them and walks you through each one.",
    },
    {
      q: "How do I cancel the Autopilot?",
      a: "From the Manage subscription page (linked in the footer and in every Autopilot email), in two clicks.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${SITE_NAME} Launch Kit`,
            description:
              "Every profile a new local business needs, written for it: Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT, with step-by-step setup and a Google verification coach.",
            brand: { "@type": "Brand", name: SITE_NAME },
            offers: kitOfferLd(prices, `${SITE_URL}/pricing`),
          },
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${SITE_NAME} Weekly Autopilot`,
            description: "An optional weekly email for a new local business: AI recommendation check, rival moves, a ready-to-post Google update and review replies, and local events to join.",
            brand: { "@type": "Brand", name: SITE_NAME },
            offers: autopilotOffersLd(prices, `${SITE_URL}/autopilot`),
          },
          faqLd(faqs),
        ]}
      />
      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-16">
        <p className="eyebrow">Pricing</p>
        <h1 className="font-display mt-3 max-w-3xl text-[2.4rem] leading-[1.07] sm:text-[3.2rem]">Free to check. Pay once to launch. The weekly email is optional.</h1>
        <p className="mt-4 max-w-2xl text-[1.1rem] text-ink-2">No contract and nothing hidden. Every paid plan has a {REFUND_DAYS}-day money-back promise.</p>
      </section>

      <Pricing />

      <Section eyebrow="In the Launch Kit" title="What your one payment covers." className="mt-24">
        <KitContents />
      </Section>

      <CostCompare />

      <Section eyebrow="Compare in detail" title="Weighing your options?" className="mt-16">
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {COMPARISONS.map((c) => (
            <li key={c.slug}>
              <Link href={`/compare/${c.slug}`} className="card group flex h-full flex-col p-5 hover:border-ink">
                <span className="font-display text-[1.15rem] leading-snug">{c.title}</span>
                <span className="mt-3 font-semibold text-accent-ink group-hover:underline">Read the comparison →</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Faq extra={faqs} />
    </>
  );
}
