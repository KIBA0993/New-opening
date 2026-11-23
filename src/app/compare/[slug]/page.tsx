import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { SearchBox } from "@/components/SearchBox";
import { COMPARISONS, comparisonBySlug } from "@/lib/compare";
import { kitPrice } from "@/lib/pricing";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { founderLd, FOUNDER } from "@/lib/founder";

export const revalidate = 300; // kit price moves with sales

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = comparisonBySlug((await params).slug);
  if (!c) return {};
  return { title: c.title, description: c.description, alternates: { canonical: `/compare/${c.slug}` } };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = comparisonBySlug((await params).slug);
  if (!c) notFound();
  const kit = (await kitPrice()).label;
  const fill = (t: string) => t.replaceAll("{kit}", kit);
  const others = COMPARISONS.filter((x) => x.slug !== c.slug);
  const url = `${SITE_URL}/compare/${c.slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: c.title,
            description: c.description,
            dateModified: c.updated,
            mainEntityOfPage: url,
            author: founderLd(),
            publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          },
          faqLd(c.faqs.map((f) => ({ q: f.q, a: fill(f.a) }))),
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-[0.9rem] text-ink-3">
        <Link href="/pricing" className="hover:text-ink">Pricing</Link> · Compare
      </nav>
      <h1 className="font-display mt-3 text-[2.2rem] leading-[1.1] sm:text-[2.8rem]">{c.title}</h1>
      <p className="mt-3 text-[0.9rem] text-ink-3">
        By <Link href="/about" className="link">{FOUNDER.name}</Link>, founder of {SITE_NAME} · Updated{" "}
        <time dateTime={c.updated}>{new Date(c.updated + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
      </p>

      <div className="mt-6 rounded-2xl border-l-4 border-accent bg-paper-2 p-5">
        <p className="eyebrow">The short answer</p>
        <p className="mt-2 text-[1.12rem] leading-relaxed">{fill(c.answer)}</p>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-[1.6rem]">Side by side</h2>
        <div className="mt-4 overflow-hidden rounded-[14px] border border-line">
          <table className="w-full border-collapse text-left text-[0.97rem]">
            <thead className="bg-paper-3 text-[0.8rem] uppercase tracking-wide text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold sm:px-4"><span className="sr-only">Question</span></th>
                <th scope="col" className="px-3 py-3 font-semibold sm:px-4">{c.them}</th>
                <th scope="col" className="px-3 py-3 font-semibold sm:px-4">MapDebut</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.label} className="border-t border-line bg-paper-2 align-top">
                  <th scope="row" className="px-3 py-3 font-semibold sm:px-4">{r.label}</th>
                  <td className="px-3 py-3 text-ink-2 sm:px-4">{r.them}</td>
                  <td className="bg-good-bg px-3 py-3 sm:px-4">{fill(r.us)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.sources.length ? (
          <p className="mt-2 text-[0.8rem] text-ink-3">
            Other options&apos; prices as published, November 2026. Sources:{" "}
            {c.sources.map((s, i) => (
              <span key={s.href}>{i ? "; " : ""}<a className="link" href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></span>
            ))}
            .
          </p>
        ) : null}
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-[1.3rem]">Pick {c.them.toLowerCase().startsWith("doing") ? "doing it yourself" : c.them} if</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-2">{c.chooseThem.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-[1.3rem]">Pick MapDebut if</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-2">{c.chooseUs.map((t) => <li key={t}>{t}</li>)}</ul>
          <Link href="/pricing" className="link mt-4 inline-block">See what&apos;s included and the {kit} price</Link>
        </div>
      </section>

      {c.switching ? (
        <section className="mt-10">
          <h2 className="font-display text-[1.6rem]">{c.switching.h}</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-ink-2 marker:font-semibold marker:text-ink">
            {c.switching.steps.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </section>
      ) : null}

      <aside className="mt-12 rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <h2 className="font-display text-[1.6rem] leading-tight">Not sure what you need yet? Start free.</h2>
        <p className="mt-2 text-[#d9d1c3]">The free check shows what AI assistants say about you, your 5 closest rivals, and where you&apos;re missing.</p>
        <div className="mt-5 [&_.field]:text-ink [&_p]:text-[#bdb4a5]"><SearchBox size="md" /></div>
      </aside>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">Questions</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {c.faqs.map((f) => (
            <div key={f.q} className="py-4"><dt className="font-semibold">{f.q}</dt><dd className="mt-1 text-ink-2">{fill(f.a)}</dd></div>
          ))}
        </dl>
      </section>

      <nav aria-label="Other comparisons" className="mt-12">
        <h2 className="font-display text-[1.4rem]">Other comparisons</h2>
        <ul className="mt-3 space-y-2">
          {others.map((o) => <li key={o.slug}><Link className="link" href={`/compare/${o.slug}`}>{o.title}</Link></li>)}
        </ul>
      </nav>
    </article>
  );
}
