import type { Metadata } from "next";
import Link from "next/link";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { SampleAnswer } from "@/components/marketing";
import { SearchBox } from "@/components/SearchBox";
import { ReportShots } from "@/components/ReportShots";
import { SITE_URL } from "@/lib/site";

const FAQ = [
  { q: "Does ChatGPT recommend my business?", a: "Run the free check. We ask AI assistants, with live web search, the questions your customers ask, like 'best nail salon near me', and show whether you're named and who's named instead." },
  { q: "How do I get ChatGPT to recommend my business?", a: "Be complete and consistent on Google, Bing, Apple Maps, Yelp and Facebook, earn recent reviews, post weekly, and claim your ChatGPT business profile. The check shows which of these you're missing." },
  { q: "Is the AI visibility check free?", a: "Yes, and no card is needed. We ask for your email so we can send you your results." },
];

export const metadata: Metadata = {
  title: "Do AI assistants recommend your business? Free AI visibility checker",
  description: "Free check: see if AI assistants recommend your local business, which nearby rivals they pick instead, and what to fix first.",
  alternates: { canonical: "/tools/chatgpt-visibility-checker" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebApplication", name: "AI visibility checker for local businesses", url: `${SITE_URL}/tools/chatgpt-visibility-checker`, applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        faqLd(FAQ),
      ]} />
      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">Free AI visibility checker</p>
          <h1 className="font-display mt-2 text-[2.3rem] leading-[1.07] sm:text-[3.1rem]">Do AI assistants recommend your business?</h1>
          <p className="mt-4 text-[1.1rem] text-ink-2">We ask AI assistants what your customers ask, find your 5 closest rivals, and show who gets named instead of you. Free, in about a minute.</p>
          <div className="mt-8 max-w-xl"><SearchBox /></div>
        </div>
        <SampleAnswer industry="beauty" />
      </div>
      <div className="-mx-4 sm:-mx-6"><ReportShots className="mt-20" /></div>
      <section className="mx-auto mt-20 max-w-2xl">
        <h2 className="font-display text-[1.8rem]">Questions</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (<div key={f.q} className="py-4"><dt className="font-semibold">{f.q}</dt><dd className="mt-1 text-ink-2">{f.a}</dd></div>))}
        </dl>
        <p className="mt-8 text-ink-2">Want the steps? Read <Link className="link" href="/guides/how-to-get-recommended-by-chatgpt-local-business">how to get recommended by ChatGPT</Link> and <Link className="link" href="/guides/claim-your-business-on-chatgpt">how to claim your business on ChatGPT</Link>.</p>
      </section>
    </div>
  );
}
