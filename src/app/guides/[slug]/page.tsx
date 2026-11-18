import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { SearchBox } from "@/components/SearchBox";
import { GUIDES_CONTENT, guideBySlug } from "@/lib/guides";
import { industryBySlug } from "@/lib/industries";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return GUIDES_CONTENT.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, modifiedTime: g.updated },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const industry = industryBySlug(g.industry);
  const related = GUIDES_CONTENT.filter((x) => x.slug !== g.slug && (!x.industry || x.industry === g.industry)).slice(0, 3);
  const url = `${SITE_URL}/guides/${g.slug}`;
  const howTo = g.sections.find((s) => s.steps);

  return (
    <article className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.title,
            description: g.description,
            dateModified: g.updated,
            datePublished: g.updated,
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          },
          faqLd(g.faqs),
          ...(howTo
            ? [{ "@context": "https://schema.org", "@type": "HowTo", name: `${g.title}: ${howTo.h}`, step: howTo.steps!.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })) }]
            : []),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
              { "@type": "ListItem", position: 2, name: g.title, item: url },
            ],
          },
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-[0.9rem] text-ink-3">
        <Link href="/guides" className="hover:text-ink">Guides</Link>
        {industry ? <> · <Link href={`/for/${industry.slug}`} className="hover:text-ink">{industry.name}</Link></> : null}
      </nav>
      <h1 className="font-display mt-3 text-[2.2rem] leading-[1.1] sm:text-[2.8rem]">{g.title}</h1>
      <p className="mt-3 text-[0.9rem] text-ink-3">
        Updated <time dateTime={g.updated}>{new Date(g.updated + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
      </p>

      <div className="mt-6 rounded-2xl border-l-4 border-accent bg-paper-2 p-5">
        <p className="eyebrow">The short answer</p>
        <p className="mt-2 text-[1.12rem] leading-relaxed">{g.answer}</p>
      </div>

      {g.sections.map((s) => (
        <section key={s.h} className="mt-10">
          <h2 className="font-display text-[1.6rem] leading-snug">{s.h}</h2>
          {s.p?.map((t) => <p key={t} className="mt-3 text-ink-2">{t}</p>)}
          {s.steps ? (
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-ink-2 marker:font-semibold marker:text-ink">
              {s.steps.map((t) => <li key={t}>{t}</li>)}
            </ol>
          ) : null}
          {s.bullets ? (
            <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-2">
              {s.bullets.map((t) => <li key={t}>{t}</li>)}
            </ul>
          ) : null}
        </section>
      ))}

      <aside className="mt-12 rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <h2 className="font-display text-[1.6rem] leading-tight">See who AI assistants recommend near you</h2>
        <p className="mt-2 text-[#d9d1c3]">Free check: we ask AI assistants the questions your customers ask, and show you what to fix.</p>
        <div className="mt-5 [&_.field]:text-ink [&_p]:text-[#bdb4a5]">
          <SearchBox size="md" industry={g.industry} />
        </div>
      </aside>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">Questions</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {g.faqs.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-ink-2">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {related.length ? (
        <nav aria-label="Related guides" className="mt-12">
          <h2 className="font-display text-[1.4rem]">Keep reading</h2>
          <ul className="mt-3 space-y-2">
            {related.map((r) => (
              <li key={r.slug}><Link className="link" href={`/guides/${r.slug}`}>{r.title}</Link></li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}
