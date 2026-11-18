import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyButton } from "@/components/BuyButton";
import { CopyButton } from "@/components/CopyButton";
import { TrackOnce } from "@/components/TrackOnce";
import { DemoTag, Pill } from "@/components/ui";
import type { Light } from "@/components/ui";
import { env, PRICES } from "@/lib/env";
import { guessIndustry, industryBySlug } from "@/lib/industries";
import { ENGINE_LABEL, engineNames } from "@/lib/providers/ai";
import { getPlace } from "@/lib/providers/places";
import { isHuman, looksLikeBot } from "@/lib/guard";
import { allowCheck } from "@/lib/ratelimit";
import { HumanCheck } from "./HumanCheck";
import { GUIDES } from "@/lib/platforms";
import { kitPrice, launchNote } from "@/lib/pricing";
import { MapGrid } from "@/components/MapGrid";
import { aiReport, aiSummary, checkContext, citationGaps, getRivals, nextFix, PLATFORM_LABEL, signals, visibility } from "@/lib/report";
import type { IndustrySlug, ListingState, Place, Platform } from "@/lib/types";

export const metadata: Metadata = { title: "Your free check", robots: { index: false } };
export const maxDuration = 60;

type SP = Promise<{ industry?: string; name?: string; city?: string }>;

export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const sp = await searchParams;

  // Crawlers, link previews and scripts never trigger Google or AI calls.
  if (await looksLikeBot()) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="eyebrow">Free check</p>
        <h1 className="font-display mt-2 text-[2.2rem] leading-tight">See how AI assistants and Google Maps rank a local business</h1>
        <p className="mt-2 text-ink-2">Open this link in a browser to see the results.</p>
      </div>
    );
  }
  // Visitors who haven't passed the invisible bot check (e.g. from a shared link) pass it first.
  if (!(await isHuman())) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="eyebrow">Free check</p>
        <HumanCheck />
      </div>
    );
  }

  let place: Place | null;
  if (id === "new") {
    if (!sp.name || !sp.city) notFound();
    place = { id: "new", name: sp.name.slice(0, 120), address: sp.city.slice(0, 120), city: sp.city.slice(0, 120), reviewCount: 0 };
  } else {
    place = await getPlace(id);
  }
  if (!place) notFound();

  const industry = (industryBySlug(sp.industry)?.slug || guessIndustry(place.types, place.primaryType, place.name) || "home-services") as IndustrySlug;
  const allowed = await allowCheck(`${id}|${place.name}|${industry}`);
  const path = id === "new"
    ? `/report/new?industry=${industry}&name=${encodeURIComponent(place.name)}&city=${encodeURIComponent(place.city || "")}`
    : `/report/${encodeURIComponent(id)}?industry=${industry}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="eyebrow">Free check</p>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight sm:text-[2.8rem]">{place.name}</h1>
      <p className="mt-1 text-ink-3">{place.address}</p>

      {allowed ? (
        <>
          <Suspense fallback={<AISkeleton engines={engineNames()} />}>
            <VisibilityHero place={place} industry={industry} />
          </Suspense>
          <Suspense fallback={<SignalsSkeleton />}>
            <SignalsSection place={place} industry={industry} />
          </Suspense>
          {place.id !== "new" ? (
            <Suspense fallback={<div className="skeleton mt-12 h-72" />}>
              <MapGrid place={place} keyword={checkContext(place, industry).term} />
            </Suspense>
          ) : null}
          <Suspense fallback={<div className="skeleton mt-12 h-96" />}>
            <AISection place={place} industry={industry} />
          </Suspense>
          <Unlock place={place} industry={industry} sharePath={path} />
        </>
      ) : (
        <div className="card mt-8 p-6">
          <h2 className="font-display text-[1.5rem]">You've used today's free checks</h2>
          <p className="mt-2 text-ink-2">Each check asks AI assistants real questions, so we limit it to {env.freeChecksPerDay} a day. Come back tomorrow, or start your Launch Kit now.</p>
        </div>
      )}
    </div>
  );
}

function SignalsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="card mt-8 p-6">
      <p className="font-display text-[1.4rem]">Checking your Google profile and nearby rivals…</p>
      <div className="skeleton mt-4 h-40" />
    </div>
  );
}

function AISkeleton({ engines }: { engines: string }) {
  return (
    <div role="status" aria-live="polite" className="mt-8">
      <div className="card p-6">
        <p className="eyebrow">AI visibility</p>
        <p className="font-display mt-2 text-[1.4rem]">Asking {engines} who they recommend near you…</p>
        <ul className="mt-4 space-y-2 text-ink-2">
          <li>Running the questions your customers ask, with live web search</li>
          <li>Looking for your listings on Yelp, Apple Maps, Bing and Facebook</li>
        </ul>
        <p className="mt-4 text-[0.9rem] text-ink-3">Usually 10 to 30 seconds. Your Google score below is ready now.</p>
      </div>
    </div>
  );
}

const STATE_LIGHT: Record<ListingState, Light> = { found: "green", different: "yellow", missing: "red", unknown: "gray" };
const STATE_LABEL: Record<ListingState, string> = { found: "Listed", different: "Wrong details", missing: "Missing", unknown: "Can't tell" };

/** The headline number: share of AI answers, across every engine, that name you. */
async function VisibilityHero({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const report = await aiReport(place, industry);
  const { pct, byEngine } = visibility(report.answers);
  const s = aiSummary(report.answers, report.rivals);
  const tone = pct >= 50 ? "text-good" : pct > 0 ? "text-warn" : "text-bad";
  return (
    <section aria-labelledby="vis" className="card mt-8 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow">AI visibility</p>
        <DemoTag show={report.demo} />
      </div>
      <h2 id="vis" className="mt-2">
        <span className={`font-display block text-[4.5rem] leading-none sm:text-[5.5rem] ${tone}`}>{pct}%</span>
        <span className="mt-2 block text-[1.1rem] text-ink-2">of AI answers recommend you when customers ask for a {checkContext(place, industry).term} near you.</span>
      </h2>
      <p className="font-display mt-4 text-[1.3rem] leading-snug">{s.headline}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {byEngine.map((e) => (
          <li key={e.engine} className="rounded-full border border-line px-3 py-1 text-[0.92rem]">
            <span className="font-semibold">{e.label}</span> named you {e.named} of {e.total}
          </li>
        ))}
      </ul>
      <a href="#answers" className="mt-4 inline-block text-[0.95rem] underline underline-offset-4">See every answer</a>
    </section>
  );
}

/** Instant: Google profile signals vs. nearby rivals. No AI calls. */
async function SignalsSection({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const { rivals, demo } = await getRivals(place, industry);
  const { items, score } = signals(place, rivals);
  const overall: Light = score >= 80 ? "green" : score >= 55 ? "yellow" : "red";
  const fix = nextFix(items, []);
  return (
    <section aria-labelledby="score" className="card mt-8 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <Pill light={overall}>{overall === "green" ? "Looking good" : overall === "yellow" ? "Some gaps" : "Customers can't find you yet"}</Pill>
        <DemoTag show={demo} />
      </div>
      <h2 id="score" className="font-display mt-3 text-[1.7rem] leading-snug sm:text-[2rem]">
        Your AI readiness score: <span className={overall === "green" ? "text-good" : overall === "yellow" ? "text-warn" : "text-bad"}>{score}</span>/100
      </h2>
      <p className="mt-1 text-ink-2">The signals AI assistants check before they recommend a local business.</p>
      <dl className="mt-5 divide-y divide-line border-y border-line">
        {items.map((s) => (
          <div key={s.label} className="flex items-start justify-between gap-3 py-3">
            <dt className="min-w-0">
              <span className="font-semibold">{s.label}</span>
              <span className="block text-[0.92rem] text-ink-3">{s.note}</span>
            </dt>
            <dd className="shrink-0"><Pill light={s.light}>{s.light === "green" ? "Good" : s.light === "yellow" ? "Improve" : "Fix"}</Pill></dd>
          </div>
        ))}
      </dl>
      <a href="#unlock" className="btn btn-accent mt-6 w-full sm:w-auto">{fix}</a>
    </section>
  );
}

/** Streams in: real AI answers (cached by question), rivals, listings. */
async function AISection({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const report = await aiReport(place, industry);
  const s = aiSummary(report.answers, report.rivals);
  const prompts = [...new Set(report.answers.map((a) => a.prompt))];
  const ind = industryBySlug(industry)!;
  const listed = report.listings.filter((l) => l.state === "found").length;
  const gaps = citationGaps(report.listings, report.rivals);

  return (
    <>
      <TrackOnce name="check_finished" data={{ industry, named: s.named, total: s.total }} />
      <section id="answers" aria-labelledby="ai" className="mt-12 scroll-mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pill light={s.light}>{s.named} of {s.total} answers name you</Pill>
          <DemoTag show={report.demo} />
        </div>
        <h2 id="ai" className="font-display mt-3 text-[1.7rem] leading-snug sm:text-[2rem]">What AI assistants said</h2>
        <p className="mt-1 text-ink-2">We asked the questions your customers ask, with live web search.</p>
        <div className="mt-5 space-y-5">
          {prompts.map((prompt) => (
            <div key={prompt} className="card p-4 sm:p-5">
              <p className="font-display text-[1.2rem]">“{prompt}”</p>
              <ul className="mt-3 divide-y divide-line">
                {report.answers
                  .filter((a) => a.prompt === prompt)
                  .map((a) => (
                    <li key={a.engine} className="py-3">
                      <details>
                        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold">{ENGINE_LABEL[a.engine]}</span>
                          <Pill light={a.mentionsYou ? "green" : "red"}>{a.mentionsYou ? "Named you" : "Didn't name you"}</Pill>
                        </summary>
                        <p className="mt-2 text-[0.95rem] text-ink-3">{a.excerpt || "No businesses named."}</p>
                      </details>
                      {a.rivalsMentioned.length ? <p className="mt-1 text-[0.92rem] text-ink-2">Named instead: {a.rivalsMentioned.join(", ")}</p> : null}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="rivals" className="mt-12">
        <h2 id="rivals" className="font-display text-[1.7rem]">You vs. nearby rivals</h2>
        <p className="mt-1 text-ink-2">The {report.rivals.length} strongest {ind.term}s within a few miles. A listing marked &ldquo;?&rdquo; means we couldn&apos;t check it.</p>
        <ul className="mt-5 space-y-3">
          <RivalRow name={`${place.name} (you)`} you rating={place.rating} reviews={place.reviewCount || 0} ai={s.named} total={s.total}
            profiles={Object.fromEntries(report.listings.map((l) => [l.platform, l.state === "unknown" ? null : l.state === "found" || l.state === "different"]))} />
          {report.rivals.map((r) => (
            <RivalRow key={r.id} name={r.name} rating={r.rating} reviews={r.reviewCount || 0} ai={r.aiMentions} total={s.total} miles={r.distanceMiles} profiles={r.profiles || {}} />
          ))}
        </ul>
      </section>

      {gaps.length ? (
        <section aria-labelledby="gaps" className="mt-12">
          <h2 id="gaps" className="font-display text-[1.7rem] leading-snug">Where your rivals are listed and you aren&apos;t</h2>
          <p className="mt-1 text-ink-2">AI assistants cross-check these sites. Each one your rivals have and you don&apos;t is a reason to pick them.</p>
          <ul className="mt-5 space-y-3">
            {gaps.map((g) => {
              const guide = GUIDES.find((x) => x.platform === g.platform);
              return (
                <li key={g.platform} className="card p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{PLATFORM_LABEL[g.platform]}</p>
                    <Pill light={g.state === "missing" ? "red" : "yellow"}>{g.rivalsListed} of {g.rivalsTotal} rivals listed</Pill>
                  </div>
                  <p className="mt-1 text-[0.95rem] text-ink-3">{g.rivalNames.join(", ")}{g.rivalsListed > g.rivalNames.length ? " and more" : ""} {g.rivalsListed === 1 ? "is" : "are"} here. {g.state === "missing" ? "You're not." : "We couldn't find you."}</p>
                  {guide ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer font-semibold text-accent">How to get listed, about {guide.minutes} minutes</summary>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.95rem] text-ink-2">
                        {guide.steps.map((st) => <li key={st}>{st}</li>)}
                      </ol>
                      <a href={guide.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-3">Open {guide.name}</a>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[0.9rem] text-ink-3">The Launch Kit fills in every field for you, ready to paste.</p>
        </section>
      ) : null}

      <section aria-labelledby="listings" className="mt-12">
        <h2 id="listings" className="font-display text-[1.7rem]">Where you're listed: {listed} of {report.listings.length}</h2>
        <p className="mt-1 text-ink-2">AI tools trust businesses whose details match everywhere.</p>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {report.listings.map((l) => (
            <li key={l.platform} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="font-semibold">{PLATFORM_LABEL[l.platform]}</p>
                <p className="text-[0.95rem] text-ink-3">{l.note}</p>
              </div>
              <Pill light={STATE_LIGHT[l.state]}>{STATE_LABEL[l.state]}</Pill>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

async function Unlock({ place, industry, sharePath }: { place: Place; industry: IndustrySlug; sharePath: string }) {
  const kit = await kitPrice();
  return (
    <>
      <section id="unlock" aria-labelledby="unlock-h" className="mt-12 scroll-mt-6 rounded-3xl bg-ink p-6 text-paper sm:p-9">
        <p className="eyebrow !text-[#f0a37f]">The Launch Kit</p>
        <h2 id="unlock-h" className="font-display mt-2 text-[1.9rem] leading-tight sm:text-[2.3rem]">Fix all of this in one afternoon.</h2>
        <ul className="mt-4 space-y-2 text-[#e3dccf]">
          <li>Your Google profile, written: categories, description, services, keywords, Q&A and 4 posts</li>
          <li>{place.id === "new" ? "Step-by-step help creating and verifying your Google profile" : "Verification and claiming coach"}</li>
          <li>Guided setup on Apple Maps, Bing, Yelp, Facebook and ChatGPT</li>
          <li>Your review link, a QR card to print, and ready-to-send review requests</li>
        </ul>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <BuyButton product="kit" placeId={place.id} industry={industry} className="btn btn-accent w-full !min-h-[56px]">
            Get my Launch Kit · {kit.label}
          </BuyButton>
          <BuyButton product="monthly" placeId={place.id} industry={industry} className="btn w-full border border-[#6b6459] !min-h-[56px] text-paper hover:bg-[#2c2924]">
            Weekly Autopilot · {PRICES.monthly.label}/mo
          </BuyButton>
        </div>
        <p className="mt-3 text-[0.9rem] text-[#bdb4a5]">{kit.leftAtPrice != null ? `${launchNote(kit)} ` : ""}One-time payment for the kit. 14-day money-back promise. Secure checkout by Stripe.</p>
      </section>
      <section className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-2">Share this check with a partner or friend.</p>
        <CopyButton text={env.siteUrl + sharePath} label="Copy link to this check" />
      </section>
      <p className="mt-6 text-[0.85rem] text-ink-3">AI answers change from day to day, so a single check is a snapshot. We refresh them every few days.</p>
    </>
  );
}

const PLATS: Platform[] = ["google", "apple", "bing", "yelp", "facebook"];

function RivalRow({ name, you, rating, reviews, ai, total, miles, profiles }: { name: string; you?: boolean; rating?: number; reviews: number; ai: number; total: number; miles?: number; profiles: Partial<Record<Platform, boolean | null>> }) {
  return (
    <li className={`card p-4 ${you ? "border-ink outline outline-1 outline-ink" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{name}</p>
        {miles != null ? <p className="text-[0.85rem] text-ink-3">{miles} mi away</p> : null}
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-[0.92rem]">
        <div><dt className="text-ink-3">Rating</dt><dd className="font-semibold">{rating ? `★ ${rating}` : "None yet"}</dd></div>
        <div><dt className="text-ink-3">Reviews</dt><dd className="font-semibold">{reviews}</dd></div>
        <div><dt className="text-ink-3">AI named</dt><dd className={`font-semibold ${ai === 0 ? "text-bad" : ""}`}>{ai} of {total}</dd></div>
      </dl>
      <p className="mt-2 flex flex-wrap gap-1.5 text-[0.8rem]">
        {PLATS.map((p) => (
          <span key={p} title={profiles[p] == null ? "Couldn't check" : undefined}
            className={`rounded-full px-2 py-0.5 ${profiles[p] ? "bg-good-bg text-good" : profiles[p] === false ? "bg-paper-3 text-ink-3 line-through" : "border border-dashed border-ink-3/40 text-ink-3"}`}>
            <span className="sr-only">{profiles[p] ? "Has" : profiles[p] === false ? "No" : "Couldn't check"} </span>
            {PLATFORM_LABEL[p]}{profiles[p] == null ? " ?" : ""}
          </span>
        ))}
      </p>
    </li>
  );
}
