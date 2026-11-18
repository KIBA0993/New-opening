import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";
import Link from "next/link";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { BASE_FAQ, Faq, HowItWorks, KitContents, Pricing, SampleAnswer } from "@/components/marketing";
import { GUIDES_CONTENT } from "@/lib/guides";
import { Section } from "@/components/ui";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ industry: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const ind = industryBySlug((await params).industry);
  if (!ind) return {};
  return { title: `Launch kit for new ${ind.name.toLowerCase()} businesses`, description: ind.hero.sub, alternates: { canonical: `/for/${ind.slug}` } };
}

export default async function IndustryPage({ params }: { params: Promise<{ industry: string }> }) {
  const ind = industryBySlug((await params).industry);
  if (!ind) notFound();
  const general = ["why-isnt-my-business-on-chatgpt", "business-not-showing-on-google-maps", "get-first-google-reviews-new-business"];
  const guides = [
    ...GUIDES_CONTENT.filter((g) => g.industry === ind.slug),
    ...GUIDES_CONTENT.filter((g) => general.includes(g.slug) && g.industry !== ind.slug),
  ];
  return (
    <>
      <JsonLd data={faqLd([...ind.faqs, ...BASE_FAQ])} />
      <section className="mx-auto grid max-w-5xl gap-12 px-4 pt-10 pb-4 sm:px-6 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">For new {ind.who}</p>
          <h1 className="font-display mt-3 text-[2.3rem] leading-[1.07] sm:text-[3.2rem]">{ind.hero.title}</h1>
          <p className="mt-5 max-w-xl text-[1.12rem] text-ink-2">{ind.hero.sub}</p>
          <div className="mt-8 max-w-xl">
            <SearchBox industry={ind.slug} />
          </div>
        </div>
        <SampleAnswer industry={ind.slug} />
      </section>

      <Section eyebrow="Sound familiar?" title="What new owners run into" className="mt-20">
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {ind.pains.map((p) => (
            <div key={p.title} className="border-t-2 border-ink pt-4">
              <h3 className="font-display text-[1.3rem] leading-snug">{p.title}</h3>
              <p className="mt-2 text-ink-2">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <HowItWorks industry={ind} />

      <Section eyebrow="Your Launch Kit" title={`Written for ${ind.name.toLowerCase()}`} className="mt-24">
        <KitContents extras={ind.kitExtras} />
      </Section>

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
