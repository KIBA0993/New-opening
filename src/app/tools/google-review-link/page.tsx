import type { Metadata } from "next";
import Link from "next/link";
import { faqLd, JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { ReviewLinkTool } from "./ReviewLinkTool";

const FAQ = [
  { q: "How do I get a direct link to leave a Google review?", a: "Find your business above and we'll build the link from your Google place ID. It opens the review box directly, so customers don't have to search for you." },
  { q: "Is this Google review QR code free?", a: "Yes. No sign-up, no watermark, and the link never expires because it points straight to Google." },
  { q: "Can I offer a discount for reviews?", a: "No. Google doesn't allow incentives for reviews. Ask every happy customer instead, right after the visit." },
];

export const metadata: Metadata = {
  title: "Free Google review link and QR code generator",
  description: "Get a direct link to your Google review page and a printable QR code in seconds. Free, no sign-up. Made for new local businesses.",
  alternates: { canonical: "/tools/google-review-link" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebApplication", name: "Google review link and QR code generator", url: `${SITE_URL}/tools/google-review-link`, applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
        faqLd(FAQ),
      ]} />
      <p className="eyebrow">Free tool</p>
      <h1 className="font-display mt-2 text-[2.3rem] leading-tight sm:text-[2.9rem]">Google review link and QR code, free</h1>
      <p className="mt-3 text-[1.1rem] text-ink-2">A direct link that opens your Google review box, plus a QR code to print. Takes ten seconds.</p>
      <div className="mt-8"><ReviewLinkTool /></div>
      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">Questions</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (<div key={f.q} className="py-4"><dt className="font-semibold">{f.q}</dt><dd className="mt-1 text-ink-2">{f.a}</dd></div>))}
        </dl>
      </section>
      <p className="mt-10 text-ink-2">
        Just opened? Reviews are step one. <Link href="/tools/chatgpt-visibility-checker" className="link">Check if ChatGPT recommends your business</Link>, free.
      </p>
    </div>
  );
}
