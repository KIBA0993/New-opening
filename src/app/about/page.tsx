import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { FOUNDER, founderLd } from "@/lib/founder";
import { CONTACT_EMAIL, REFUND_DAYS, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About MapDebut: who we are and how we work",
  description: "MapDebut helps newly opened local businesses get found on Google, Maps and AI assistants. Who builds it, how the free check works, and how to reach us.",
  alternates: { canonical: "/about" },
};

const FACTS = [
  ["Launched", "November 17, 2026"],
  ["Based in", "Atlanta, Georgia, USA"],
  ["What it is", "Self-serve software for new local businesses"],
  ["Founder", FOUNDER.name],
  ["Contact", CONTACT_EMAIL],
] as const;

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            url: `${SITE_URL}/about`,
            mainEntity: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              email: CONTACT_EMAIL,
              foundingDate: "2026-11-17",
              founder: founderLd(),
              address: { "@type": "PostalAddress", addressLocality: "Atlanta", addressRegion: "GA", addressCountry: "US" },
            },
          },
        ]}
      />
      <p className="eyebrow">About</p>
      <h1 className="font-display mt-2 text-[2.3rem] leading-tight sm:text-[2.9rem]">We help new local businesses get found from day one.</h1>
      <p className="mt-4 text-[1.1rem] text-ink-2">
        A business that just opened is invisible in all the places customers look: Google Maps, Apple Maps, Yelp, and now AI assistants like ChatGPT. Setting all of that up takes a new owner
        evenings they don&apos;t have, and small mistakes, like a keyword in the name, can get a brand-new profile suspended. {SITE_NAME} writes everything for you and walks you through it in an afternoon.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-[1.6rem]">Who builds it</h2>
        <p className="mt-3 text-ink-2">
          {SITE_NAME} is built by {FOUNDER.name}. {FOUNDER.bio} You can follow along on{" "}
          <a className="link" href={FOUNDER.x} target="_blank" rel="noopener noreferrer">X</a>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[1.6rem]">How we work</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-2">
          <li>The free check asks AI assistants the questions your customers ask, with live web search, and shows you exactly what they answered.</li>
          <li>We never sign in to your accounts. You own every profile and login.</li>
          <li>We don&apos;t sell fake reviews, buy links or promise rankings. No one can guarantee what Google or an AI assistant will show.</li>
          <li>Every guide is written from what we see when we test real searches for new businesses, and dated so you know how fresh it is.</li>
          <li>Not happy? Full refund within {REFUND_DAYS} days.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[1.6rem]">The facts</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {FACTS.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 py-3">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-ink-2">{k === "Contact" ? <a className="link" href={`mailto:${v}`}>{v}</a> : v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-ink-2">
        Start with the <Link className="link" href="/start">free check</Link>, read our <Link className="link" href="/research/new-business-ai-visibility">research on new businesses and AI assistants</Link>, or browse the{" "}
        <Link className="link" href="/guides">guides</Link>.
      </p>
    </article>
  );
}
