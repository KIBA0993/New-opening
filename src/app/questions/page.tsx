import type { Metadata } from "next";
import Link from "next/link";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { SearchBox } from "@/components/SearchBox";
import { GUIDES_CONTENT, TOPICS } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";

// One page of short, direct answers to what new owners ask most (forums, Google's help community,
// People Also Ask). Built from the guides so every answer links to the full guide. Made to be quoted.
export const metadata: Metadata = {
  title: "Questions new business owners ask about Google Maps, reviews and ChatGPT",
  description:
    "Straight answers for owners who just opened: why you're not on Google Maps, suspensions, hiding your home address, first reviews, and getting recommended by ChatGPT.",
  alternates: { canonical: "/questions" },
};

const slugify = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

export default function QuestionsPage() {
  const groups = TOPICS.map((t) => ({
    ...t,
    items: GUIDES_CONTENT.filter((g) => g.topic === t.id).flatMap((g) => g.faqs.map((f) => ({ ...f, guide: g }))),
  })).filter((t) => t.items.length);
  const all = groups.flatMap((t) => t.items);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd
        data={[
          faqLd(all),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [{ "@type": "ListItem", position: 1, name: "Questions new owners ask", item: `${SITE_URL}/questions` }],
          },
        ]}
      />
      <p className="eyebrow">Owner questions</p>
      <h1 className="font-display mt-2 text-[2.4rem] leading-tight sm:text-[3rem]">What new business owners ask, answered</h1>
      <p className="mt-3 text-[1.1rem] text-ink-2">
        The questions owners post most in their first months, from forums and Google&apos;s own help community. Short answers here, full guides one click away.
      </p>
      <nav aria-label="Topics" className="mt-6 flex flex-wrap gap-2">
        {groups.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="rounded-full border border-line px-3 py-1 text-[0.95rem] text-ink-2 hover:text-ink">{t.name}</a>
        ))}
      </nav>

      {groups.map((t) => (
        <section key={t.id} id={t.id} className="mt-12 scroll-mt-20">
          <h2 className="font-display text-[1.7rem]">{t.name}</h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {t.items.map((f) => (
              <div key={f.q} id={slugify(f.q)} className="py-4 scroll-mt-20">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1 text-ink-2">
                  {f.a}{" "}
                  <Link className="link whitespace-nowrap" href={`/guides/${f.guide.slug}`}>Full guide</Link>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <aside className="mt-14 rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <h2 className="font-display text-[1.6rem] leading-tight">See who AI assistants recommend near you</h2>
        <p className="mt-2 text-[#d9d1c3]">Free check: we ask Google, ChatGPT, Gemini and Perplexity the questions your customers ask, and show you what to fix.</p>
        <div className="mt-5 [&_.field]:text-ink [&_p]:text-[#bdb4a5]">
          <SearchBox size="md" />
        </div>
      </aside>
    </div>
  );
}
