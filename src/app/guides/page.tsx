import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES_CONTENT } from "@/lib/guides";
import { industryBySlug } from "@/lib/industries";

export const metadata: Metadata = {
  title: "Guides for new local businesses",
  description: "Plain-English guides for owners who just opened: Google verification, claiming your business on ChatGPT, first reviews, and finding customers.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  const general = GUIDES_CONTENT.filter((g) => !g.industry);
  const byIndustry = GUIDES_CONTENT.filter((g) => g.industry);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="eyebrow">Guides</p>
      <h1 className="font-display mt-2 text-[2.4rem] leading-tight sm:text-[3rem]">Get found, in plain English</h1>
      <p className="mt-3 text-[1.1rem] text-ink-2">Short, practical answers for owners in their first 90 days. No jargon.</p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {general.map((g) => (
          <li key={g.slug} className="py-5">
            <Link href={`/guides/${g.slug}`} className="group block">
              <span className="font-display text-[1.35rem] leading-snug group-hover:underline">{g.title}</span>
              <span className="mt-1 block text-ink-3">{g.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="font-display mt-14 text-[1.7rem]">By business type</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {byIndustry.map((g) => (
          <li key={g.slug} className="py-5">
            <Link href={`/guides/${g.slug}`} className="group block">
              <span className="eyebrow !text-ink-3">{industryBySlug(g.industry)?.name}</span>
              <span className="font-display mt-1 block text-[1.3rem] leading-snug group-hover:underline">{g.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
