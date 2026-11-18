import type { Metadata } from "next";
import { CREDITS } from "@/lib/credits";
import { BuyButton } from "@/components/BuyButton";
import { Check } from "@/components/ui";
import { PRICES } from "@/lib/env";
import { renderDigestHtml } from "@/lib/email";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import { sampleDigest } from "@/lib/sample";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Weekly Autopilot",
  alternates: { canonical: "/autopilot" },
  description: "One email every Monday: AI recommendation check, rival moves, a Google post and review replies written for you, and local events to join.",
};

export default async function AutopilotPage({ searchParams }: { searchParams: Promise<{ industry?: string }> }) {
  const { industry: slug } = await searchParams;
  const industry = industryBySlug(slug) || INDUSTRIES[0];
  const html = renderDigestHtml(sampleDigest(industry));
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow">Weekly Autopilot</p>
          <h1 className="font-display mt-2 text-[2.3rem] leading-tight sm:text-[3rem]">Five minutes every Monday. That&apos;s your marketing.</h1>
          <p className="mt-4 text-[1.1rem] text-ink-2">Most owners set up their Google profile once and forget it. The ones who keep showing up post, reply and show up in their neighborhood every week. We write all of it for you.</p>
          <ul className="mt-6 space-y-3">
            {[
              "Are AI assistants naming you yet?",
              "What your nearby rivals did this week, and your counter-move",
              "A Google post, ready to paste",
              "Replies to your new reviews, written",
              "One campaign idea for the season",
              "Local markets, fairs and drives to join or sponsor, with the pitch written",
              `${CREDITS.monthly} on-demand AI re-checks a month, to see if a change worked`,
            ].map((t) => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 text-good" />{t}</li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <BuyButton product="monthly">Start for {PRICES.monthly.label}/month</BuyButton>
            <BuyButton product="yearly" className="btn btn-ghost w-full">{PRICES.yearly.label}/year, save $119</BuyButton>
          </div>
          <p className="mt-3 text-[0.9rem] text-ink-3">Cancel any time. If you haven&apos;t run your free check yet, we&apos;ll do that first so the email is about your business.</p>
          <nav aria-label="Sample for another business type" className="mt-8">
            <p className="text-[0.9rem] font-semibold">See the sample for:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {INDUSTRIES.map((i) => (
                <li key={i.slug}>
                  <Link href={`/autopilot?industry=${i.slug}`} scroll={false} aria-current={i.slug === industry.slug ? "page" : undefined}
                    className={`inline-flex min-h-[40px] items-center rounded-full border px-3 text-[0.9rem] ${i.slug === industry.slug ? "border-ink bg-ink text-paper" : "border-line bg-paper-2 hover:border-ink"}`}>
                    {i.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div>
          <p className="mb-2 text-[0.9rem] text-ink-3">A sample Monday email</p>
          <iframe title="Sample weekly email" srcDoc={html} className="h-[78vh] min-h-[560px] w-full rounded-2xl border border-line bg-paper shadow-[0_18px_40px_-24px_rgba(28,26,22,0.45)]" />
        </div>
      </div>
    </div>
  );
}
