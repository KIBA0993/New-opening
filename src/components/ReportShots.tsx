import Image from "next/image";
import Link from "next/link";
import { Section } from "./ui";

// Real screenshots of the free-check report page (public/shots), taken with the app's sample data
// for a made-up salon, so no real business is shown. Retake them when the report design changes.
const SHOTS = [
  { src: "/shots/score.webp", w: 1480, h: 884, title: "Your AI visibility score", alt: "Free check report: an AI visibility score of 20 out of 100, with AI assistants naming the business in 1 of 3 answers" },
  { src: "/shots/answers.webp", w: 1480, h: 1850, title: "What each AI assistant said", alt: "Free check report: three customer questions, which AI assistant named the business, which rivals each one picked, and the sites it read" },
  { src: "/shots/rivals.webp", w: 1480, h: 1236, title: "You vs. your nearest rivals", alt: "Free check report: the business next to nearby rivals, with rating, review count, how often AI named each, and which listings each has" },
  { src: "/shots/mapgrid.webp", w: 1480, h: 1508, title: "Where you rank on Google Maps", alt: "Free check report: a 3 by 3 grid of Google Maps positions around the business, from #5 near the shop to #11 a few blocks away" },
];

/** "What the free check shows": screenshots of the actual report, so visitors (and AI crawlers) see the output. */
export function ReportShots({ className = "mt-24" }: { className?: string }) {
  return (
    <Section eyebrow="What the free check shows" title="The report you get in about a minute." className={className}>
      <p className="mt-3 max-w-2xl text-ink-2">
        Screenshots of the free check&apos;s report, shown with sample data for a made-up salon. Yours runs real customer questions with live web search, and checks your real rivals and listings.
      </p>
      <div className="mt-8 grid items-start gap-5 sm:grid-cols-2">
        {SHOTS.map((s) => (
          <figure key={s.src} className="card overflow-hidden p-0">
            <figcaption className="border-b border-line px-5 py-3 font-semibold">{s.title}</figcaption>
            <Image src={s.src} width={s.w} height={s.h} alt={s.alt} sizes="(min-width: 640px) 480px, 100vw" className="h-auto w-full" />
          </figure>
        ))}
      </div>
      <Link href="/start" className="btn btn-primary mt-8">Run my free check</Link>
    </Section>
  );
}
