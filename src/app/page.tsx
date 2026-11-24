import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { BASE_FAQ, CostCompare, Faq, HowItWorks, KitContents, LaunchPriceLine, Pricing, SampleAnswer, Stats } from "@/components/marketing";
import { ProductDemo } from "@/components/ProductDemo";
import { ReportShots } from "@/components/ReportShots";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { kitPrice } from "@/lib/pricing";
import { autopilotOffersLd, kitOfferLd, priceFacts } from "@/lib/priceFacts";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Section } from "@/components/ui";
import { INDUSTRIES } from "@/lib/industries";
import { TRADES } from "@/lib/trades";

export const metadata: Metadata = { alternates: { canonical: "/" } };
export const revalidate = 300; // kit price moves with sales, and every price switches when the launch deal ends

export default async function Home() {
  const prices = priceFacts((await kitPrice()).amount);
  return (
    <>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: SITE_NAME,
            url: SITE_URL,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: "Launch kit for new local businesses: free AI visibility check, AI-written profiles for Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT, and a weekly autopilot.",
            offers: [
              { "@type": "Offer", name: "Free check", price: "0", priceCurrency: "USD" },
              kitOfferLd(prices, `${SITE_URL}/pricing`),
              ...autopilotOffersLd(prices, `${SITE_URL}/autopilot`),
            ],
          },
          faqLd(BASE_FAQ),
        ]}
      />
      <section className="mx-auto grid max-w-5xl gap-12 px-4 pt-10 pb-4 sm:px-6 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">For businesses that just opened</p>
          <h1 className="font-display mt-3 text-[2.5rem] leading-[1.05] sm:text-[3.6rem]">
            Your new business, found on Google, Maps and AI assistants this week.
          </h1>
          <p className="mt-5 max-w-xl text-[1.15rem] text-ink-2">
            See who AI recommends instead of you, for free. Then set up every profile in one afternoon, with everything written for you.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox />
          </div>
          <LaunchPriceLine />
        </div>
        <div className="lg:pl-4">
          <SampleAnswer industry="home-services" />
        </div>
      </section>

      <Stats />

      <Section eyebrow="See it work" title="From your business name to every profile written, in 20 seconds." className="mt-20">
        <div className="mt-8"><ProductDemo /></div>
      </Section>

      <HowItWorks />

      <ReportShots />

      <Section eyebrow="The Launch Kit" title="Everything a new business needs to be found, written for you." className="mt-24">
        <KitContents />
      </Section>

      <Section eyebrow="Made for" title="Built for owners, not marketers." className="mt-24">
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((i) => (
            <li key={i.slug}>
              <Link href={`/for/${i.slug}`} className="card group flex h-full flex-col p-5 hover:border-ink">
                <span className="font-display text-[1.3rem]">{i.name}</span>
                <span className="mt-1 text-ink-3">{i.who[0].toUpperCase() + i.who.slice(1)}</span>
                <span className="mt-3 font-semibold text-accent-ink group-hover:underline">See how it works for you →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-ink-2">
          <span className="font-semibold">By trade: </span>
          {TRADES.map((t, i) => (
            <span key={t.slug}>
              {i ? ", " : ""}
              <Link className="link" href={`/for/${t.slug}`}>{t.name.toLowerCase()}</Link>
            </span>
          ))}
          .
        </p>
      </Section>

      <CostCompare />
      <Pricing />
      <Faq />

      <Section className="mt-24">
        <div className="rounded-3xl bg-ink px-6 py-10 text-paper sm:px-10 sm:py-14">
          <h2 className="font-display text-[2rem] leading-tight sm:text-[2.6rem]">Find out who AI assistants recommend instead of you.</h2>
          <p className="mt-3 max-w-xl text-[#d9d1c3]">Free, one minute, no card needed.</p>
          <div className="mt-6 max-w-xl [&_.field]:text-ink [&_p]:text-[#bdb4a5]">
            <SearchBox size="md" />
          </div>
        </div>
      </Section>
    </>
  );
}
