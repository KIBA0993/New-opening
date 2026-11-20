import { CONTACT_EMAIL, REFUND_DAYS } from "@/lib/site";
import Link from "next/link";
import { PRICES } from "@/lib/env";
import { kitPrice, launchNote } from "@/lib/pricing";
import { DEAL, dealEndLabel, dealOn, KIT_TRIAL_DAYS } from "@/lib/deal";
import { BuyButton } from "./BuyButton";
import { KitBuy } from "./KitBuy";
import type { Industry } from "@/lib/industries";
import { Check, Pill, Section } from "./ui";

const SAMPLE: Record<string, { q: string; picks: string[]; you: string }> = {
  "home-services": { q: "best house cleaner in Austin", picks: ["Sparkle & Shine Cleaning", "Lone Star Maids", "TidyNest Co."], you: "Bright Day Cleaning" },
  beauty: { q: "best nail salon near South Congress", picks: ["Polished Nail Lounge", "The Gilded Tip", "Bloom Nail Bar"], you: "Your salon" },
  "food-trucks": { q: "best food trucks in East Austin", picks: ["Taco Rueda", "Kimchi Wagon", "Holy Crepe!"], you: "Your truck" },
  pet: { q: "dog groomer near Mueller with good reviews", picks: ["Wag & Wash Grooming", "Barkside Pet Spa", "The Dapper Dog"], you: "Your shop" },
  wellness: { q: "best massage therapist in Austin", picks: ["Restore Massage Studio", "Still Water Spa", "Greenleaf Wellness"], you: "Your practice" },
  restaurants: { q: "best new restaurant in East Austin", picks: ["Juniper Kitchen", "Ember & Oak", "Casa Lupita"], you: "Your restaurant" },
};

/** A small editorial "receipt" showing what the free check reveals. */
export function SampleAnswer({ industry = "beauty" }: { industry?: string }) {
  const s = SAMPLE[industry] || SAMPLE.beauty;
  return (
    <figure className="card relative rotate-[0.6deg] p-5 shadow-[0_18px_40px_-24px_rgba(28,26,22,0.45)] sm:p-6">
      <figcaption className="eyebrow !text-ink-3">Example AI answer</figcaption>
      <p className="font-display mt-2 text-[1.35rem] leading-snug">“{s.q}”</p>
      <ol className="mt-4 space-y-2">
        {s.picks.map((p, i) => (
          <li key={p} className="flex items-center justify-between gap-3 border-b border-dashed border-line pb-2">
            <span>
              <span className="mr-2 text-ink-3">{i + 1}.</span>
              {p}
            </span>
            <Pill light="green">Named</Pill>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 pt-1">
          <span className="font-semibold">{s.you}</span>
          <Pill light="red">Not named</Pill>
        </li>
      </ol>
      <p className="mt-4 text-[0.85rem] text-ink-3">Example. Your free check runs real questions with live web search.</p>
    </figure>
  );
}

export function Stats() {
  const items = [
    { n: "45%", t: "of people used AI tools to find a local business in the past year, up from 6%." },
    { n: "35%", t: "of owners keep their Google profile up to date. Most set it up once and forget it." },
    { n: "3.4×", t: "more often AI answers quote Yelp than any other directory." },
  ];
  return (
    <Section className="mt-20">
      <div className="grid gap-6 border-y border-line py-8 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.n}>
            <p className="font-display text-[2.6rem] leading-none text-accent">{i.n}</p>
            <p className="mt-2 text-ink-2">{i.t}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[0.8rem] text-ink-3">Sources: BrightLocal consumer and small business surveys, 2026; study of 28M AI answers reported by PPC Land.</p>
    </Section>
  );
}

export function HowItWorks({ industry }: { industry?: Industry }) {
  const steps = [
    {
      n: "1",
      title: "Free check, one minute",
      body: "Type your business name. We ask AI assistants who they'd recommend near you, find your 5 closest rivals, and check where you're listed.",
    },
    {
      n: "2",
      title: "Launch Kit, one afternoon",
      body: `Every profile written for you: Google, Apple Maps, Bing, Yelp, Facebook and ChatGPT. Tap copy, paste, done. A coach gets you through Google's verification${industry?.serviceArea ? ", even the truck-and-tools video" : ""}.`,
    },
    {
      n: "3",
      title: "Autopilot, five minutes a week",
      body: `One email each Monday: are AI tools naming you yet, what your rivals did, a Google post ready to paste, replies to new reviews, and ${industry?.slug === "food-trucks" ? "markets and vendor calls" : "local events"} worth joining.`,
    },
  ];
  return (
    <Section id="how" eyebrow="How it works" title="From invisible to recommended, without learning marketing." className="mt-24">
      <ol className="mt-10 grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="relative pt-6">
            <span aria-hidden className="font-display absolute top-0 left-0 text-[3.5rem] leading-none text-paper-3 -z-0">{s.n}</span>
            <div className="relative">
              <h3 className="font-display text-[1.4rem]">{s.title}</h3>
              <p className="mt-2 text-ink-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function KitContents({ extras = [] }: { extras?: string[] }) {
  const items = [
    "The best Google categories for you, picked and explained",
    "Your description, services, keywords and 5 Q&As, written",
    "Your first 4 Google posts, written",
    "Verification coach with a shot list that passes",
    "Step-by-step setup for Apple Maps, Bing, Yelp, Facebook and ChatGPT",
    "One set of details to paste everywhere, so nothing conflicts",
    "Your Google review link, a printable QR card, and text and email templates",
    ...extras,
  ];
  return (
    <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i} className="flex gap-3">
          <Check className="mt-0.5 text-good" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

export async function Pricing({ cta = "/start" }: { cta?: string }) {
  const kit = await kitPrice();
  const deal = dealOn();
  return (
    <Section id="pricing" eyebrow="Pricing" title="Pay once to launch. Stay found for less than a lunch a week." className="mt-24">
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <div className="card p-6">
          <h3 className="font-display text-[1.4rem]">Free check</h3>
          <p className="mt-1 text-[2.2rem] font-semibold">$0</p>
          <ul className="mt-4 space-y-2 text-ink-2">
            {["What AI assistants say about you", "You vs. your 5 closest rivals", "Where you're listed and where you're missing"].map((t) => (
              <li key={t} className="flex gap-2"><Check className="mt-0.5 text-good" />{t}</li>
            ))}
          </ul>
          <Link href={cta} className="btn btn-ghost mt-6 w-full">Run my free check</Link>
        </div>
        <div className="card relative border-ink p-6 outline outline-1 outline-ink">
          <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-[0.8rem] font-semibold text-white">Most owners start here</span>
          <h3 className="font-display text-[1.4rem]">Launch Kit</h3>
          <p className="mt-1 text-[2.2rem] font-semibold">{kit.label} <span className="text-base font-normal text-ink-3">one time</span></p>
          {kit.leftAtPrice != null ? <p className="text-[0.9rem] font-semibold text-accent">{launchNote(kit)}</p> : null}
          {deal ? <p className="text-[0.9rem] text-ink-3" data-nosnippet>${DEAL.kitAfter} after the launch deal ends {dealEndLabel()}.</p> : null}
          <ul className="mt-4 space-y-2 text-ink-2">
            {["Every profile written for you", "Verification coach", "Guided setup on 6 platforms", "Review link, QR card and templates", "Yours to keep", ...(KIT_TRIAL_DAYS > 0 ? ["Optional: first week of Autopilot free"] : [])].map((t) => (
              <li key={t} className="flex gap-2"><Check className="mt-0.5 text-good" />{t}</li>
            ))}
          </ul>
          <div className="mt-6"><KitBuy kitLabel={kit.label} monthlyLabel={PRICES.monthly.label} trialDays={KIT_TRIAL_DAYS} className="btn btn-primary w-full" /></div>
          <Link href={cta} className="link mt-3 inline-block text-[0.95rem]">Or run the free check first</Link>
        </div>
        <div className="card p-6">
          <h3 className="font-display text-[1.4rem]">Weekly Autopilot</h3>
          <p className="mt-1 text-[2.2rem] font-semibold">{PRICES.monthly.label} <span className="text-base font-normal text-ink-3">{PRICES.monthly.note}</span></p>
          <p className="text-[0.9rem] text-ink-3">or {PRICES.yearly.label} {PRICES.yearly.note}</p>
          {deal && DEAL.monthlyAfter !== DEAL.monthlyNow ? <p className="text-[0.9rem] font-semibold text-accent" data-nosnippet>Lock in this price. New plans are ${DEAL.monthlyAfter}/mo after {dealEndLabel()}.</p> : null}
          <ul className="mt-4 space-y-2 text-ink-2">
            {["Weekly AI recommendation check", "Rival moves and what to do about them", "A Google post and review replies, written", "Local events to join, with the pitch written"].map((t) => (
              <li key={t} className="flex gap-2"><Check className="mt-0.5 text-good" />{t}</li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2">
            <BuyButton product="monthly" className="btn btn-primary w-full">Start for {PRICES.monthly.label}/month</BuyButton>
            <BuyButton product="yearly" className="btn btn-ghost w-full">{PRICES.yearly.label}/year{PRICES.yearly.save > 0 ? `, save $${PRICES.yearly.save}` : ""}</BuyButton>
          </div>
          <Link href="/autopilot" className="link mt-3 inline-block text-[0.95rem]">See a sample email</Link>
        </div>
      </div>
      <p className="mt-4 text-[0.9rem] text-ink-3">{REFUND_DAYS}-day money-back promise: not happy, email <a className="link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> within {REFUND_DAYS} days of paying for a full refund. Cancel the autopilot any time, in two clicks.</p>
    </Section>
  );
}

export const BASE_FAQ = [
  {
    q: "Do you set up my profiles for me?",
    a: "You stay in control. Google, Yelp and the others require the owner to sign in and verify, so we write every field, link you to the right page, and walk you through it. Most owners finish in one afternoon.",
  },
  {
    q: "Can you guarantee AI assistants will recommend me?",
    a: "No one can, and you should be wary of anyone who says so. What we can do is make sure every source AI tools read about you is complete and consistent, and show you each week whether it's working.",
  },
  {
    q: "What if it's not for me?",
    a: `Email ${CONTACT_EMAIL} within ${REFUND_DAYS} days of paying and we'll refund you in full, no questions asked. That covers the Launch Kit and your first Autopilot payment.`,
  },
  {
    q: "I haven't opened yet. Is it too early?",
    a: "It's the perfect time. Google profiles can take days or weeks to verify, so starting before opening day means you're findable on opening day.",
  },
  {
    q: "Do I need a website?",
    a: "Not to get on Google Maps. A complete Google profile is enough to start. AI assistants do cite business websites more than any other source, so your kit includes ready-to-paste service pages for when you build a simple site.",
  },
];

export function Faq({ extra = [] }: { extra?: { q: string; a: string }[] }) {
  const items = [...extra, ...BASE_FAQ];
  return (
    <Section eyebrow="Questions" title="Straight answers" className="mt-24">
      <div className="mt-8 divide-y divide-line border-y border-line">
        {items.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-[1.1rem] font-semibold">
              {f.q}
              <span aria-hidden className="text-2xl leading-none text-ink-3 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 max-w-3xl text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/** One line under the hero search box: today's kit price and how many are left at it (real Stripe sales). */
export async function LaunchPriceLine() {
  const kit = await kitPrice();
  if (!dealOn() || kit.leftAtPrice == null) return null;
  return (
    <p className="mt-4 text-[0.95rem] text-ink-2">
      <Link href="/#pricing" className="font-semibold text-accent-ink underline underline-offset-4">Launch Kit {kit.label}</Link>
      <span className="text-ink-3"> · {kit.leftAtPrice} left at this price, then ${kit.next}.</span>
    </p>
  );
}

// Typical prices, Nov 2026. Sources are listed under the table; update them when they change.
const COMPARE_SOURCES = [
  { label: "BrightLocal pricing", href: "https://www.brightlocal.com/pricing/" },
  { label: "SlashPost, GBP optimization cost (Sep 2026)", href: "https://slashpost.ai/blogs/google-business-profile/google-business-profile-optimization-cost" },
];

/** "What it costs to get found": the kit next to the usual alternatives for a new business. */
export async function CostCompare() {
  const kit = await kitPrice();
  const rows: { name: string; first: string; year: string; you: string; you2: string; highlight?: boolean }[] = [
    {
      name: "Hire a local SEO agency",
      first: "$300 to $500 setup",
      year: "$1,800 to $6,500",
      you: "They write and set up your Google profile",
      you2: "Plus $125 to $500 a month to keep it going",
    },
    {
      name: "BrightLocal (DIY software)",
      first: "$41 a month",
      year: "$369 or more",
      you: "Tracking and reports, but you write everything",
      you2: "Directory listings cost extra, from $2 to $3.20 each",
    },
    {
      name: "Figure it out yourself",
      first: "$0",
      year: "$0, plus many evenings",
      you: "Work out what each of 6+ sites wants",
      you2: "Easy to miss what AI assistants read",
    },
    {
      name: "MapDebut Launch Kit",
      first: `${kit.label} once`,
      year: `${kit.label}, no monthly fee`,
      you: "Every profile written for you, step-by-step setup",
      you2: `${REFUND_DAYS}-day money-back promise. Autopilot is optional.`,
      highlight: true,
    },
  ];
  return (
    <Section eyebrow="Compare" title="What it usually costs to get a new business found." className="mt-24">
      <p className="mt-3 max-w-2xl text-ink-2">Year one for one location: a Google profile plus the directories AI assistants read.</p>
      <div className="mt-8 hidden overflow-hidden rounded-[14px] border border-line sm:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-paper-3 text-[0.85rem] uppercase tracking-wide text-ink-3">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Option</th>
              <th scope="col" className="px-4 py-3 font-semibold">To start</th>
              <th scope="col" className="px-4 py-3 font-semibold">Year one</th>
              <th scope="col" className="px-4 py-3 font-semibold">What you get</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className={`border-t border-line ${r.highlight ? "bg-good-bg" : "bg-paper-2"}`}>
                <th scope="row" className="px-4 py-4 align-top font-display text-[1.15rem] font-normal">{r.name}</th>
                <td className={`px-4 py-4 align-top ${r.highlight ? "font-semibold" : ""}`}>{r.first}</td>
                <td className={`px-4 py-4 align-top ${r.highlight ? "text-[1.15rem] font-semibold text-good" : "font-semibold"}`}>{r.year}</td>
                <td className="px-4 py-4 align-top text-ink-2">{r.you}<span className="block text-[0.9rem] text-ink-3">{r.you2}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-8 grid gap-3 sm:hidden">
        {rows.map((r) => (
          <li key={r.name} className="card p-4" style={r.highlight ? { background: "var(--good-bg)", borderColor: "var(--good)" } : undefined}>
            <p className="font-display text-[1.2rem]">{r.name}</p>
            <p className="mt-1"><span className="text-ink-3">Year one: </span><span className={`font-semibold ${r.highlight ? "text-good" : ""}`}>{r.year}</span></p>
            <p className="text-[0.92rem] text-ink-3">To start: {r.first}</p>
            <p className="mt-2 text-ink-2">{r.you}</p>
            <p className="text-[0.9rem] text-ink-3">{r.you2}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.8rem] text-ink-3">
        Typical prices, November 2026. Agency year one is setup plus 12 months of upkeep. Sources:{" "}
        {COMPARE_SOURCES.map((s, i) => (
          <span key={s.href}>{i ? "; " : ""}<a className="link" href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></span>
        ))}
        .
      </p>
    </Section>
  );
}
