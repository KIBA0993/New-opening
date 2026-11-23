import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SearchBox } from "@/components/SearchBox";
import { founderLd, FOUNDER } from "@/lib/founder";
import { pct, STUDY as S } from "@/lib/research";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Do AI assistants recommend new businesses? We checked 122 that just opened";
const DESC = `We asked an AI assistant with live web search about ${S.sampled} Chicago businesses licensed in the last 1 to 4 months. It named only ${pct(S.namedForCategory)} of them when asked for the best in their neighborhood.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `/research/${S.slug}` },
  openGraph: { type: "article", title: TITLE, description: DESC, url: `/research/${S.slug}` },
};

const dateLabel = new Date(S.ran + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// Each finding is one complete sentence, so it can be quoted on its own.
const FINDINGS = [
  { big: pct(S.namedForCategory), text: `of new businesses (${S.namedForCategory.n} of ${S.namedForCategory.of}) were named when we asked an AI assistant for the best places of their kind in their own neighborhood.` },
  { big: pct(S.onMaps), text: `of new businesses (${S.onMaps.n} of ${S.onMaps.of}) could be found on Google Maps 1 to 4 months after getting their license.` },
  { big: pct(S.under10Reviews), text: `of the new businesses on Google Maps (${S.under10Reviews.n} of ${S.under10Reviews.of}) had fewer than 10 Google reviews.` },
  { big: pct(S.foundByName), text: `of new businesses (${S.foundByName.n} of ${S.foundByName.of}) could be found by the AI assistant when asked about them by exact name and address.` },
];

export default function ResearchPage() {
  const url = `${SITE_URL}/research/${S.slug}`;
  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: TITLE,
            description: DESC,
            datePublished: S.ran,
            dateModified: S.ran,
            mainEntityOfPage: url,
            author: founderLd(),
            publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          },
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "AI assistant visibility of newly opened Chicago businesses (November 2026)",
            description: DESC,
            url,
            creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            temporalCoverage: "2026-07/2026-11",
            spatialCoverage: "Chicago, Illinois, USA",
            isBasedOn: "https://data.cityofchicago.org/Community-Economic-Development/Business-Licenses/r5kz-chrr",
            variableMeasured: ["Listed on Google Maps", "Google review count", "Named by AI assistant for a category question", "Found by AI assistant by name"],
          },
        ]}
      />
      <p className="eyebrow">MapDebut research</p>
      <h1 className="font-display mt-2 text-[2.2rem] leading-[1.1] sm:text-[2.8rem]">{TITLE}</h1>
      <p className="mt-3 text-[0.9rem] text-ink-3">
        By <Link href="/about" className="link">{FOUNDER.name}</Link>, founder of {SITE_NAME} · Data collected <time dateTime={S.ran}>{dateLabel}</time>
      </p>

      <div className="mt-6 rounded-2xl border-l-4 border-accent bg-paper-2 p-5">
        <p className="eyebrow">The short answer</p>
        <p className="mt-2 text-[1.12rem] leading-relaxed">
          Mostly no. We took {S.sampled} businesses that got a {S.city} business license 1 to 4 months ago and asked an AI assistant with live web search for the best places of
          their kind in their neighborhood. It named {S.namedForCategory.n} of them ({pct(S.namedForCategory)}). Most could be found when asked about by name ({pct(S.foundByName)}), so the AI can see them. It just
          doesn&apos;t recommend them yet.
        </p>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {FINDINGS.map((f) => (
          <div key={f.text} className="card p-5">
            <p className="font-display text-[2.6rem] leading-none text-accent">{f.big}</p>
            <p className="mt-2 text-ink-2">{f.big} {f.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">A website helps, a little</h2>
        <p className="mt-3 text-ink-2">
          Of the new businesses with a website on their Google profile, {pct(S.namedWithWebsite)} ({S.namedWithWebsite.n} of {S.namedWithWebsite.of}) were named for their neighborhood. Of
          those without one, {pct(S.namedNoWebsite)} ({S.namedNoWebsite.n} of {S.namedNoWebsite.of}) were. Being on Google Maps mattered more for being found at all: the AI found{" "}
          {pct(S.foundByNameOnMaps)} of businesses with a Maps listing by name, against {pct(S.foundByNameNotOnMaps)} of those without one. These groups are small, so read them as a
          direction, not a precise figure.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">By type of business</h2>
        <div className="mt-4 overflow-x-auto rounded-[14px] border border-line">
          <table className="w-full border-collapse text-left text-[0.95rem]">
            <thead className="bg-paper-3 text-[0.8rem] uppercase tracking-wide text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold">Type</th>
                <th scope="col" className="px-3 py-3 font-semibold">Sample</th>
                <th scope="col" className="px-3 py-3 font-semibold">On Google Maps</th>
                <th scope="col" className="px-3 py-3 font-semibold">Named for neighborhood</th>
                <th scope="col" className="px-3 py-3 font-semibold">Found by name</th>
              </tr>
            </thead>
            <tbody>
              {S.byCategory.map((c) => (
                <tr key={c.label} className="border-t border-line bg-paper-2">
                  <th scope="row" className="px-3 py-3 font-semibold">{c.label}</th>
                  <td className="px-3 py-3">{c.n}</td>
                  <td className="px-3 py-3">{Math.round(c.onMaps)}%</td>
                  <td className="px-3 py-3">{Math.round(c.named)}%</td>
                  <td className="px-3 py-3">{Math.round(c.found)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">What this means if you just opened</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-2">
          <li>Getting on Google Maps is step one, and more than a quarter of new businesses in our sample hadn&apos;t done it 1 to 4 months in.</li>
          <li>Being findable isn&apos;t the same as being recommended. AI answers for &quot;best in my area&quot; lean on review counts and on sites that write about a business, which new businesses don&apos;t have yet.</li>
          <li>The levers you control: a complete Google profile, matching listings on Apple Maps, Bing and Yelp, a simple website that names your services, and steady reviews from real customers.</li>
        </ul>
        <p className="mt-4 text-ink-2">
          Our guides cover each step, starting with <Link href="/guides/how-to-get-recommended-by-chatgpt-local-business" className="link">how to get recommended by ChatGPT as a local business</Link> and{" "}
          <Link href="/guides/business-not-showing-on-google-maps" className="link">what to do when you&apos;re not showing on Google Maps</Link>.
        </p>
      </section>

      <aside className="mt-12 rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <h2 className="font-display text-[1.6rem] leading-tight">Are you one of the {S.sampled - S.namedForCategory.n}?</h2>
        <p className="mt-2 text-[#d9d1c3]">The free check asks AI assistants the questions your customers ask and shows who they name instead of you.</p>
        <div className="mt-5 [&_.field]:text-ink [&_p]:text-[#bdb4a5]"><SearchBox size="md" /></div>
      </aside>

      <section className="mt-12">
        <h2 className="font-display text-[1.6rem]">How we did it</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-ink-2 marker:font-semibold marker:text-ink">
          <li>
            We took new business licenses issued in {S.city} 30 to 120 days before {dateLabel} ({S.licensesInWindow.toLocaleString("en-US")} licenses) from the city&apos;s public{" "}
            <a className="link" href="https://data.cityofchicago.org/Community-Economic-Development/Business-Licenses/r5kz-chrr" target="_blank" rel="noopener noreferrer">business license data</a>.
          </li>
          <li>We kept customer-facing businesses in the types above, removed national chains, and picked up to 22 per type in a fixed pseudo-random order. That gave {S.sampled} businesses (only 12 new pet licenses fell in the window).</li>
          <li>We looked each one up with the Google Places API, matching on name and location, and recorded whether it had a listing, its review count and whether it listed a website.</li>
          <li>We asked an AI assistant with live web search, set to Chicago: &quot;What are the best [type] in [neighborhood], Chicago?&quot; A business counted as named only if its distinctive name appeared in the answer.</li>
          <li>We asked the same assistant about each business by exact name and address, and counted it as found when the assistant said it found information about that business. This second measure may be slightly generous.</li>
        </ol>
        <p className="mt-4 text-[0.9rem] text-ink-3">
          Limits: one city, one AI assistant, one run on one day. AI answers vary between runs and between assistants. The pet sample is small (12), so read per-type numbers as a direction. We&apos;ll re-run this and update the date above when we do. Questions or want the method details? Email{" "}
          <a className="link" href="mailto:support@mapdebut.com">support@mapdebut.com</a>.
        </p>
      </section>
    </article>
  );
}
