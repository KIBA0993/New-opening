import type { Metadata } from "next";
import Link from "next/link";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { NameChecker } from "./NameChecker";

const FAQ = [
  {
    q: "Can I put keywords in my Google Business Profile name?",
    a: "No. Google's guidelines say the name must match what customers see on your sign, storefront and paperwork. Adding services, your city, or words like \"best\" is keyword stuffing, and it's one of the most common reasons new profiles are suspended.",
  },
  {
    q: "My real business name includes my city or service. Is that allowed?",
    a: "Yes, if that's genuinely your name on your sign and business license. Keep a photo of your signage and your license handy in case Google asks for proof.",
  },
  {
    q: "Will changing my name fix a suspension?",
    a: "Fixing the name is usually step one, but don't make lots of edits at once. Fix the name, gather proof (license, signage photo), then file one appeal. Our suspension guide walks through it.",
  },
  {
    q: "Does this tool store what I type?",
    a: "No. The check runs entirely in your browser and nothing is sent to us.",
  },
];

export const metadata: Metadata = {
  title: "Google Business Profile name checker: will your name get suspended?",
  description: "Free tool: check your business name against Google's name rules. Spots keywords, locations, phone numbers, taglines and symbols that get new profiles suspended.",
  alternates: { canonical: "/tools/business-name-checker" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Google Business Profile name checker",
            url: `${SITE_URL}/tools/business-name-checker`,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          faqLd(FAQ),
        ]}
      />
      <p className="eyebrow">Free tool</p>
      <h1 className="font-display mt-2 text-[2.3rem] leading-tight sm:text-[2.9rem]">Will your business name get your Google profile suspended?</h1>
      <p className="mt-3 text-[1.1rem] text-ink-2">
        Type the name you plan to use. We check it against Google&apos;s name rules and show what to remove. Free, no sign-up, nothing leaves your browser.
      </p>
      <div className="mt-8"><NameChecker /></div>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">What Google checks in a business name</h2>
        <p className="mt-3 text-ink-2">
          Your name on Google should match your name in the real world: the sign over the door, your truck, your business license. Google removes or suspends profiles that add anything else. The things it looks for:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-2">
          <li>Services or keywords that aren&apos;t part of your brand (&quot;Joe&apos;s Plumbing &amp; Drain Cleaning Austin&quot;)</li>
          <li>Your city or neighborhood, unless it&apos;s really in your name</li>
          <li>Marketing words: best, #1, affordable, licensed, emergency</li>
          <li>Hours (&quot;open 24/7&quot;), phone numbers and web addresses</li>
          <li>Symbols and emoji (★, ™). &quot;&amp;&quot; is fine.</li>
        </ul>
        <p className="mt-3 text-[0.9rem] text-ink-3">
          Based on Google&apos;s{" "}
          <a className="link" href="https://support.google.com/business/answer/3038177" target="_blank" rel="noopener noreferrer">guidelines for representing your business on Google</a>.
          This tool flags common patterns. It can&apos;t promise what Google&apos;s reviewers will decide.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">Questions</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <div key={f.q} className="py-4"><dt className="font-semibold">{f.q}</dt><dd className="mt-1 text-ink-2">{f.a}</dd></div>
          ))}
        </dl>
      </section>
      <p className="mt-10 text-ink-2">
        Already suspended? Read{" "}
        <Link href="/guides/google-business-profile-suspended-new-business" className="link">why new profiles get suspended and how to get reinstated</Link>.
        Not suspended but can&apos;t find yourself? See{" "}
        <Link href="/guides/business-not-showing-on-google-maps" className="link">why your business isn&apos;t showing on Google Maps</Link>.
      </p>
    </div>
  );
}
