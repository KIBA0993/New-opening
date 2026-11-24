import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";
import Link from "next/link";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { BASE_FAQ, Faq, HowItWorks, KitContents, Pricing, SampleAnswer } from "@/components/marketing";
import { ReportShots } from "@/components/ReportShots";
import { GUIDES_CONTENT } from "@/lib/guides";
import { Section } from "@/components/ui";
import { INDUSTRIES, industryBySlug, type Industry } from "@/lib/industries";
import { kitPrice } from "@/lib/pricing";
import { kitOfferLd, priceFacts } from "@/lib/priceFacts";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { TRADES, tradeBySlug, tradesFor, type Trade } from "@/lib/trades";

export const revalidate = 300; // the pricing block moves with kit sales and the launch deal

// /for/<slug> serves both the six verticals (home-services, beauty, ...) and the trades under them
// (house-cleaning, plumber, nail-salon, ...). A trade borrows everything it doesn't override from its vertical.
export function generateStaticParams() {
  return [...INDUSTRIES.map((i) => ({ industry: i.slug })), ...TRADES.map((t) => ({ industry: t.slug }))];
}

interface PageData {
  slug: string;
  ind: Industry; // the vertical, with a trade's own words merged in
  trade?: Trade;
  title: string;
  description: string;
  eyebrow: string;
  guideSlugs: string[];
}

function resolve(slug: string): PageData | null {
  const ind = industryBySlug(slug);
  if (ind) {
    return {
      slug,
      ind,
      title: `Launch kit for new ${ind.name.toLowerCase()} businesses`,
      description: ind.hero.sub,
      eyebrow: `For new ${ind.who}`,
      guideSlugs: [],
    };
  }
  const trade = tradeBySlug(slug);
  const parent = trade && industryBySlug(trade.parent);
  if (!trade || !parent) return null;
  return {
    slug,
    trade,
    ind: { ...parent, term: trade.term, hero: { title: trade.h1, sub: trade.sub }, pains: trade.pains, kitExtras: trade.kitExtras, faqs: trade.faqs },
    title: trade.title,
    description: trade.description,
    eyebrow: `For new ${trade.noun}`,
    guideSlugs: trade.guides,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const p = resolve((await params).industry);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/for/${p.slug}` },
    openGraph: { title: p.title, description: p.description, url: `/for/${p.slug}` },
    twitter: { card: "summary_large_image", title: p.title, description: p.description },
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ industry: string }> }) {
  const p = resolve((await params).industry);
  if (!p) notFound();
  const { ind, trade } = p;
  const prices = priceFacts((await kitPrice()).amount);
  const url = `${SITE_URL}/for/${p.slug}`;

  const general = ["why-isnt-my-business-on-chatgpt", "business-not-showing-on-google-maps", "get-first-google-reviews-new-business"];
  const guides = trade
    ? p.guideSlugs.map((s) => GUIDES_CONTENT.find((g) => g.slug === s)).filter((g) => g != null)
    : [...GUIDES_CONTENT.filter((g) => g.industry === ind.slug), ...GUIDES_CONTENT.filter((g) => general.includes(g.slug) && g.industry !== ind.slug)];
  const trades = trade ? tradesFor(trade.parent).filter((t) => t.slug !== trade.slug) : tradesFor(ind.slug);
  const forWho = trade ? trade.name.toLowerCase() : ind.name.toLowerCase();

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${SITE_NAME} Launch Kit for new ${forWho} businesses`,
            description: `Every profile a new ${forWho} business needs, written for it: Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT, with step-by-step setup and a Google verification coach.${trade ? ` Includes: ${trade.kitExtras.join("; ")}.` : ""}`,
            brand: { "@type": "Brand", name: SITE_NAME },
            category: trade ? `Local marketing for ${trade.noun}` : `Local marketing for ${ind.who}`,
            url,
            offers: kitOfferLd(prices, url),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
              ...(trade
                ? [
                    { "@type": "ListItem", position: 2, name: industryBySlug(trade.parent)!.name, item: `${SITE_URL}/for/${trade.parent}` },
                    { "@type": "ListItem", position: 3, name: trade.name, item: url },
                  ]
                : [{ "@type": "ListItem", position: 2, name: ind.name, item: url }]),
            ],
          },
          faqLd([...ind.faqs, ...BASE_FAQ]),
        ]}
      />
      <section className="mx-auto grid max-w-5xl gap-12 px-4 pt-10 pb-4 sm:px-6 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          {trade ? (
            <p className="mb-3 text-[0.9rem] text-ink-3">
              <Link className="link" href={`/for/${trade.parent}`}>{industryBySlug(trade.parent)!.name}</Link> <span aria-hidden>›</span> {trade.name}
            </p>
          ) : null}
          <p className="eyebrow">{p.eyebrow}</p>
          <h1 className="font-display mt-3 text-[2.3rem] leading-[1.07] sm:text-[3.2rem]">{ind.hero.title}</h1>
          <p className="mt-5 max-w-xl text-[1.12rem] text-ink-2">{ind.hero.sub}</p>
          <div className="mt-8 max-w-xl">
            <SearchBox industry={ind.slug} />
          </div>
        </div>
        <SampleAnswer industry={ind.slug} sample={trade?.sample} />
      </section>

      <Section eyebrow="Sound familiar?" title="What new owners run into" className="mt-20">
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {ind.pains.map((x) => (
            <div key={x.title} className="border-t-2 border-ink pt-4">
              <h3 className="font-display text-[1.3rem] leading-snug">{x.title}</h3>
              <p className="mt-2 text-ink-2">{x.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <ReportShots />

      <HowItWorks industry={ind} />

      <Section eyebrow="Your Launch Kit" title={`Written for ${forWho} businesses`} className="mt-24">
        <KitContents extras={ind.kitExtras} />
        {trade ? (
          <p className="mt-4 text-ink-2">
            Your kit picks <strong>{trade.category}</strong> as your Google primary category and writes every profile around the searches customers use for a {trade.term}.
          </p>
        ) : null}
      </Section>

      {trades.length ? (
        <Section eyebrow={trade ? "Related trades" : "Pick your trade"} title={trade ? `Other ${industryBySlug(trade.parent)!.name.toLowerCase()} businesses` : `Made for your kind of ${ind.name.toLowerCase()} business`} className="mt-24">
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trades.map((t) => (
              <li key={t.slug}>
                <Link href={`/for/${t.slug}`} className="card group flex h-full flex-col p-5 hover:border-ink">
                  <span className="font-display text-[1.2rem]">{t.name}</span>
                  <span className="mt-1 text-ink-3">For new {t.noun}</span>
                  <span className="mt-3 font-semibold text-accent-ink group-hover:underline">See how it works for you →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section eyebrow="Ideas you'll get" title="Campaigns that fit your business" className="mt-24">
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {ind.campaigns.map((c) => (
            <div key={c.title} className="card p-5">
              <h3 className="font-semibold">{c.title}</h3>
              <p className="mt-1 text-ink-2">{c.idea}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-ink-3">Plus nearby {ind.eventKinds.slice(0, 3).join(", ")} to join, every week.</p>
      </Section>

      {guides.length ? (
        <Section eyebrow="Read first" title="Guides for you" className="mt-24">
          <ul className="mt-6 space-y-2">
            {guides.map((g) => (
              <li key={g.slug}><Link className="link text-[1.15rem]" href={`/guides/${g.slug}`}>{g.title}</Link></li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Pricing cta={`/start?industry=${ind.slug}`} />
      <Faq extra={ind.faqs} />
    </>
  );
}
