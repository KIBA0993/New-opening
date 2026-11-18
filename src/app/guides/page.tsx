import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GUIDES_CONTENT, TOPICS } from "@/lib/guides";
import { industryBySlug } from "@/lib/industries";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides for new local businesses: Google Maps, reviews and ChatGPT",
  description:
    "Plain-English guides for owners who just opened: not showing on Google Maps, suspensions, video verification, first reviews, and getting recommended by ChatGPT.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  const groups = TOPICS.map((t) => ({ ...t, guides: GUIDES_CONTENT.filter((g) => g.topic === t.id) })).filter((t) => t.guides.length);
  const untagged = GUIDES_CONTENT.filter((g) => !g.topic);
  if (untagged.length) groups.push({ id: "customers", name: "More guides", guides: untagged });
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Guides for new local businesses",
          itemListElement: GUIDES_CONTENT.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/guides/${g.slug}`, name: g.title })),
        }}
      />
      <p className="eyebrow">Guides</p>
      <h1 className="font-display mt-2 text-[2.4rem] leading-tight sm:text-[3rem]">Get found, in plain English</h1>
      <p className="mt-3 text-[1.1rem] text-ink-2">
        Short, practical answers for owners in their first 90 days. No jargon. In a hurry? Read the{" "}
        <Link className="link" href="/questions">quick answers to common questions</Link>.
      </p>
      {groups.map((t) => (
        <section key={t.name} className="mt-12">
          <h2 className="font-display text-[1.7rem]">{t.name}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {t.guides.map((g) => (
              <li key={g.slug} className="py-5">
                <Link href={`/guides/${g.slug}`} className="group block">
                  {g.industry && t.id === "customers" ? <span className="eyebrow !text-ink-3">{industryBySlug(g.industry)?.name}</span> : null}
                  <span className="font-display block text-[1.3rem] leading-snug group-hover:underline">{g.title}</span>
                  <span className="mt-1 block text-ink-3">{g.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
