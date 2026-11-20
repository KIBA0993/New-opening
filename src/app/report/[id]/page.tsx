import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { KitBuy } from "@/components/KitBuy";
import { BuyButton } from "@/components/BuyButton";
import { CopyButton } from "@/components/CopyButton";
import { TrackOnce } from "@/components/TrackOnce";
import { DemoTag, Pill } from "@/components/ui";
import type { Light } from "@/components/ui";
import { env, PRICES } from "@/lib/env";
import { guessIndustry, industryBySlug, pluralTerm } from "@/lib/industries";
import { ENGINE_LABEL, engineNames } from "@/lib/providers/ai";
import { getPlace, locateTown } from "@/lib/providers/places";
import { withSiteTerm } from "@/lib/providers/profile";
import { allowIp, isHuman, looksLikeBot } from "@/lib/guard";
import { allowCheck } from "@/lib/ratelimit";
import { isAdmin } from "@/lib/admin";
import { HumanCheck } from "./HumanCheck";
import { SectionBoundary } from "@/components/SectionBoundary";
import { GUIDES } from "@/lib/platforms";
import { kitPrice, launchNote, type KitPrice } from "@/lib/pricing";
import { DEAL, dealOn, KIT_TRIAL_DAYS } from "@/lib/deal";
import { MapGrid } from "@/components/MapGrid";
import { aiReport, aiSummary, checkContext, citationGaps, engineReadiness, findFixes, placementLabel, placementPoints, PLATFORM_LABEL, readiness, visibility, visibilityScore } from "@/lib/report";
import { cache } from "react";
import { EmailReport, ShowFew, StickyBuyBar } from "./ReportClient";
import type { IndustrySlug, ListingState, Place, Platform } from "@/lib/types";

export const metadata: Metadata = { title: "Your free check", robots: { index: false } };
// A first-time check (AI answers, listings, Maps grid, profile lookups) can take over a minute.
export const maxDuration = 300;

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

  // Each view makes Google lookups, so cap page loads per visitor: plenty for a person, not for a script.
  if (!(await allowIp("report-view", 30, 600))) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="eyebrow">Free check</p>
        <h1 className="font-display mt-2 text-[2.2rem] leading-tight">Too many reloads</h1>
        <p className="mt-2 text-ink-2">You've opened a lot of checks in the last few minutes. Please wait about 10 minutes and try again.</p>
      </div>
    );
  }

  let place: Place | null;
  if (id === "new") {
    if (!sp.name || !sp.city) notFound();
    place = { id: "new", name: sp.name.slice(0, 120), address: sp.city.slice(0, 120), city: sp.city.slice(0, 120), reviewCount: 0 };
  } else {
    place = await getPlace(id);
    // Service-area businesses hide their address, so Google gives us no location. Ask which town
    // they serve instead of checking against made-up rivals and a blank town.
    if (place && place.lat == null && !place.id.startsWith("demo_")) {
      place = await locateTown(place, sp.city);
      if (place.lat == null) return <TownForm place={place} industry={sp.industry} tried={!!sp.city} />;
    }
  }
  if (!place) notFound();

  const industry = (industryBySlug(sp.industry)?.slug || guessIndustry(place.types, place.primaryType, place.name) || "home-services") as IndustrySlug;
  if (place.id !== "new") place = await withSiteTerm(place, industry);
  const allowed = await allowCheck(`${id}|${place.name}|${industry}`);
  const path = id === "new"
    ? `/report/new?industry=${industry}&name=${encodeURIComponent(place.name)}&city=${encodeURIComponent(place.city || "")}`
    : `/report/${encodeURIComponent(id)}?industry=${industry}${place.serviceArea && sp.city ? `&city=${encodeURIComponent(sp.city.slice(0, 120))}` : ""}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="eyebrow">Free check</p>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight sm:text-[2.8rem]">{place.name}</h1>
      <p className="mt-1 text-ink-3">
        {place.serviceArea ? (
          <>
            Serves {place.city} <a href={`?${new URLSearchParams({ ...(sp.industry ? { industry: sp.industry } : {}), city: "" })}`} className="ml-1 underline">change town</a>
          </>
        ) : (
          place.address
        )}
      </p>
      {place.id !== "new" && (await isAdmin()) ? (
        <a href={`/admin/kit?place=${encodeURIComponent(place.id)}&industry=${industry}`} className="mt-2 inline-block rounded-full bg-warn-bg px-3 py-1 text-[0.85rem] font-semibold text-warn">
          Admin: preview this business&apos;s Launch Kit →
        </a>
      ) : null}

      {allowed ? (
        <>
          <TrackOnce name="check_started" data={{ industry }} />
          <Suspense fallback={<QuickOfferView place={place} industry={industry} kit={null} />}>
            <QuickOffer place={place} industry={industry} />
          </Suspense>
          <SectionBoundary>
            <Suspense fallback={<AISkeleton engines={engineNames()} />}>
              <VisibilityHero place={place} industry={industry} />
              <TopFixes place={place} industry={industry} />
              <AISection place={place} industry={industry} />
            </Suspense>
          </SectionBoundary>
          <SectionBoundary>
            <Suspense fallback={<div className="skeleton mt-12 h-64" />}>
              <EngineBars place={place} industry={industry} />
            </Suspense>
          </SectionBoundary>
          <SectionBoundary>
            <Suspense fallback={<SignalsSkeleton />}>
              <SignalsSection place={place} industry={industry} />
            </Suspense>
          </SectionBoundary>
          {place.id !== "new" ? (
            <SectionBoundary>
              <Suspense fallback={<div className="skeleton mt-12 h-72" />}>
                <MapGrid place={place} keyword={checkContext(place, industry).term} />
                <KitLine>The Launch Kit sets up what moves you up on Maps</KitLine>
              </Suspense>
            </SectionBoundary>
          ) : null}
          <SectionBoundary>
            <Suspense fallback={null}>
              <Unlock place={place} industry={industry} sharePath={path} />
            </Suspense>
          </SectionBoundary>
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

/** For a business that hides its address: which town to check it in. A plain GET form, so it works without JavaScript. */
function TownForm({ place, industry, tried }: { place: Place; industry?: string; tried: boolean }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="eyebrow">Free check</p>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight sm:text-[2.8rem]">{place.name}</h1>
      <form method="get" className="card mt-5 p-5 sm:p-7">
        <label htmlFor="town" className="font-semibold">Which town do you serve?</label>
        <p className="mt-1 text-ink-2">
          Your Google profile hides your address, which is right for a business that goes to its customers. We&apos;ll check who Google and AI assistants recommend in the town you name.
        </p>
        {industryBySlug(industry) ? <input type="hidden" name="industry" value={industry} /> : null}
        <input id="town" name="city" required maxLength={120} className="field mt-3" placeholder="Morrisville, NC" autoComplete="address-level2" />
        {tried ? <p className="mt-2 text-[0.92rem] text-bad">We couldn&apos;t find that town. Try the town and state, like &ldquo;Cary, NC&rdquo;.</p> : null}
        <button type="submit" className="btn btn-primary mt-4">Run my check</button>
      </form>
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

const STATE_LIGHT: Record<ListingState, Light> = { found: "green", different: "yellow", missing: "red", unknown: "gray", claim: "gray" };
const STATE_LABEL: Record<ListingState, string> = { found: "Listed", different: "Wrong details", missing: "Missing", unknown: "Can't tell", claim: "Claim it" };

/** The headline number: 0 to 100 from where you land in each AI answer (top pick, lower down, a mention, or not at all). */
async function VisibilityHero({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const report = await aiReport(place, industry);
  const { score } = visibilityScore(report.answers);
  const s = aiSummary(report.answers, report.rivals);
  const tone = score >= 60 ? "text-good" : score > 0 ? "text-warn" : "text-bad";
  return (
    <section aria-labelledby="vis" className="card mt-8 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow">AI visibility</p>
        <DemoTag show={report.demo} />
      </div>
      <h2 id="vis" className="mt-2">
        <span className={`font-display block text-[4.5rem] leading-none sm:text-[5.5rem] ${tone}`}>{score}<span className="text-[0.4em] text-ink-3">/100</span></span>
        <span className="mt-2 block text-[1.1rem] text-ink-2">How strongly AI assistants recommend you when customers ask for a {checkContext(place, industry).term} near you.</span>
      </h2>
      <p className="font-display mt-4 text-[1.3rem] leading-snug">{s.headline}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {report.answers.map((a, i) => (
          <li key={i} className="rounded-full border border-line px-3 py-1 text-[0.92rem]">
            <span className="font-semibold">Q{i + 1}</span> {placementLabel(a)} <span className="text-ink-3">· {placementPoints(a)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.9rem] text-ink-3">Each answer scores 100 if you&apos;re the top pick, 40 to 80 if you&apos;re further down the list, 25 for a passing mention and 0 if you&apos;re not named. AI answers change from one ask to the next, so this is a snapshot.</p>
      <a href="#answers" className="mt-3 inline-block text-[0.95rem] underline underline-offset-4">See every answer and the sites the AI read</a>
    </section>
  );
}

const toneOf = (n: number): Light => (n >= 80 ? "green" : n >= 55 ? "yellow" : "red");
const TONE_TEXT: Record<Light, string> = { green: "text-good", yellow: "text-warn", red: "text-bad", gray: "text-ink-2" };
const TONE_BAR: Record<Light, string> = { green: "bg-good", yellow: "bg-[#c98a00]", red: "bg-bad", gray: "bg-ink-3" };

/** Readiness per kind of assistant: each one reads different sources. Streams in after the listings. */
async function EngineBars({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const { bars, overall, demo } = await engineReadiness(place, industry);
  const tone = toneOf(overall);
  return (
    <section aria-labelledby="bars" className="card mt-12 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow">AI readiness by assistant</p>
        <DemoTag show={demo} />
      </div>
      <h2 id="bars" className="font-display mt-3 text-[1.7rem] leading-snug sm:text-[2rem]">
        Your AI readiness score: <span className={TONE_TEXT[tone]}>{overall}</span>/100
      </h2>
      <p className="mt-1 text-ink-2">Each assistant reads different sources, so you can be ready for one and invisible to another.</p>
      <ul className="mt-5 space-y-5">
        {bars.map((b) => {
          const t = toneOf(b.score);
          const todo = b.items.filter((i) => i.light !== "green");
          return (
            <li key={b.key}>
              <div className="flex items-baseline justify-between gap-3">
                <p>
                  <span className="font-semibold">{b.label}</span>
                  <span className="block text-[0.9rem] text-ink-3">{b.sub}</span>
                </p>
                <p className={`font-display shrink-0 text-[1.4rem] ${TONE_TEXT[t]}`}>{b.score}</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper-3" role="img" aria-label={`${b.label}: ${b.score} out of 100`}>
                <div className={`h-full ${TONE_BAR[t]}`} style={{ width: `${Math.max(3, b.score)}%` }} />
              </div>
              {b.key === "google" ? (
                <a href="#score" className="mt-2 inline-block text-[0.92rem] underline underline-offset-4">See the Google profile checks</a>
              ) : b.items.length ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[0.92rem] underline underline-offset-4">
                    {todo.length ? `${todo.length} to fix for ${b.label}` : `What we checked for ${b.label}`}
                  </summary>
                  <dl className="mt-2 divide-y divide-line border-y border-line">
                    {b.items.map((s) => (
                      <div key={s.label} className="flex items-start justify-between gap-3 py-3">
                        <dt className="min-w-0">
                          <span className="font-semibold">{s.label}</span>
                          <span className="block text-[0.92rem] text-ink-3">{s.note}</span>
                        </dt>
                        <dd className="shrink-0"><Pill light={s.light}>{s.light === "green" ? "Good" : s.light === "yellow" ? "Improve" : "Fix"}</Pill></dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
      <KitLine>The Launch Kit covers all three</KitLine>
    </section>
  );
}

/** Instant: Google profile signals vs. nearby rivals. No AI calls. */
async function SignalsSection({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const { items, score, demo } = await readiness(place, industry);
  const overall: Light = score >= 80 ? "green" : score >= 55 ? "yellow" : "red";
  return (
    <section id="score" aria-labelledby="score-h" className="card mt-12 scroll-mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <Pill light={overall}>{overall === "green" ? "Looking good" : overall === "yellow" ? "Some gaps" : "Customers can't find you yet"}</Pill>
        <DemoTag show={demo} />
      </div>
      <h2 id="score-h" className="font-display mt-3 text-[1.7rem] leading-snug sm:text-[2rem]">
        Google AI readiness: <span className={overall === "green" ? "text-good" : overall === "yellow" ? "text-warn" : "text-bad"}>{score}</span>/100
      </h2>
      <p className="mt-1 text-ink-2">What Google&apos;s AI and Maps check on your Google profile before they recommend you.</p>
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
      <KitLine>The Launch Kit fixes every item marked Fix or Improve</KitLine>
    </section>
  );
}

/** Streams in: real AI answers (cached by question), rivals, listings. */
async function AISection({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const report = await aiReport(place, industry);
  const s = aiSummary(report.answers, report.rivals);
  const prompts = [...new Set(report.answers.map((a) => a.prompt))];
  const term = checkContext(place, industry).term;
  // When no rival was named anywhere, a column of zeros says nothing: show who the AI picked instead.
  const anyRivalNamed = report.rivals.some((r) => r.aiMentions > 0);
  const outsidePicks = s.picked.slice(0, 4);
  const checked = report.listings.filter((l) => l.state !== "claim");
  const toClaim = report.listings.filter((l) => l.state === "claim");
  const listed = checked.filter((l) => l.state === "found").length;
  const gaps = citationGaps(report.listings, report.rivals);
  const counts = new Map<string, number>();
  for (const a of report.answers) for (const d of a.sources || []) counts.set(d, (counts.get(d) || 0) + 1);
  const topSources = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([d]) => d);

  return (
    <>
      <TrackOnce name="check_finished" data={{ industry, named: s.named, total: s.total }} />
      <section id="answers" aria-labelledby="ai" className="mt-12 scroll-mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pill light={s.light}>{s.named} of {s.total} answers name you</Pill>
          <DemoTag show={report.demo} />
        </div>
        <h2 id="ai" className="font-display mt-3 text-[1.7rem] leading-snug sm:text-[2rem]">What AI assistants said</h2>
        <p className="mt-1 text-ink-2">We asked three kinds of questions customers ask: a general one, one about a specific service, and one about a need. Each ran with live web search.</p>
        {topSources.length ? (
          <p className="mt-3 rounded-xl bg-paper-3 p-3 text-[0.95rem] text-ink-2">
            <b>Where the AI looked:</b> {topSources.join(", ")}. Being listed with the same details on these sites is how you get into the answer.
          </p>
        ) : null}
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
                          <Pill light={placementPoints(a) >= 60 ? "green" : placementPoints(a) > 0 ? "yellow" : "red"}>{placementLabel(a)}</Pill>
                        </summary>
                        <p className="mt-2 text-[0.95rem] text-ink-3">{a.excerpt || "No businesses named."}</p>
                      </details>
                      {a.placement !== "first" && (a.picks?.length || (!a.mentionsYou && a.rivalsMentioned.length)) ? <p className="mt-1 text-[0.92rem] text-ink-2">{ENGINE_LABEL[a.engine]} picked: {(a.picks?.length ? a.picks : a.rivalsMentioned).join(", ")}</p> : null}
                      {a.sources?.length ? <p className="mt-1 text-[0.85rem] text-ink-3">Sources it read: {a.sources.slice(0, 5).join(", ")}</p> : null}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <KitLine>The Launch Kit writes the profile details AI assistants look for</KitLine>
      </section>

      <section aria-labelledby="rivals" className="mt-12">
        <h2 id="rivals" className="font-display text-[1.7rem]">You vs. nearby rivals</h2>
        <p className="mt-1 text-ink-2">The {report.rivals.length} strongest {pluralTerm(term)} near you on Google Maps. A listing marked &ldquo;?&rdquo; means we couldn&apos;t check it.</p>
        {!anyRivalNamed && outsidePicks.length ? (
          <p className="mt-3 rounded-xl bg-paper-3 p-3 text-[0.95rem] text-ink-2">
            <b>AI didn&apos;t name {s.named ? "any of these rivals" : "you or any of these"}.</b> It recommended {outsidePicks.map((p) => p.name).join(", ")} instead. Those are your real rivals in AI answers.
          </p>
        ) : null}
        <ShowFew few={3} label={`See all ${report.rivals.length} rivals`}>
          <RivalRow name={`${place.name} (you)`} you rating={place.rating} reviews={place.reviewCount || 0} ai={anyRivalNamed ? s.named : undefined} total={s.total}
            profiles={Object.fromEntries(report.listings.map((l) => [l.platform, l.state === "unknown" || l.state === "claim" ? null : l.state === "found" || l.state === "different"]))} />
          {report.rivals.map((r) => (
            <RivalRow key={r.id} name={r.name} rating={r.rating} reviews={r.reviewCount || 0} ai={anyRivalNamed ? r.aiMentions : undefined} total={s.total} miles={r.distanceMiles} profiles={r.profiles || {}} />
          ))}
        </ShowFew>
        <KitLine>Catch up to them with the Launch Kit</KitLine>
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
          <KitLine>The Launch Kit fills in every field for you, ready to paste</KitLine>
        </section>
      ) : null}

      <section aria-labelledby="listings" className="mt-12">
        <h2 id="listings" className="font-display text-[1.7rem]">Where you're listed: {listed} of {checked.length}</h2>
        <p className="mt-1 text-ink-2">AI tools trust businesses whose details match everywhere.</p>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {checked.map((l) => (
            <li key={l.platform} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="font-semibold">{PLATFORM_LABEL[l.platform]}</p>
                <p className="text-[0.95rem] text-ink-3">{l.note}</p>
              </div>
              <Pill light={STATE_LIGHT[l.state]}>{STATE_LABEL[l.state]}</Pill>
            </li>
          ))}
        </ul>
        {toClaim.length ? (
          <>
            <h3 className="font-display mt-8 text-[1.3rem]">Claim these too</h3>
            <p className="mt-1 text-[0.95rem] text-ink-2">No outside check can see these listings, so claim them yourself. Each takes a few minutes.</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {toClaim.map((l) => (
                <li key={l.platform} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div>
                    <p className="font-semibold">{PLATFORM_LABEL[l.platform]}</p>
                    <p className="text-[0.95rem] text-ink-3">{l.note}</p>
                  </div>
                  {l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost shrink-0">Claim it ↗</a> : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <KitLine>The Launch Kit gets you listed with the same details everywhere</KitLine>
      </section>
    </>
  );
}

/** Shared per request: the fixes the check found, and whether the business is already in good shape. */
const standing = cache(async (place: Place, industry: IndustrySlug) => {
  const [report, sig, eng] = await Promise.all([aiReport(place, industry), readiness(place, industry), engineReadiness(place, industry)]);
  // Google signals first, then the ChatGPT and website checks (each label once).
  const all = [...sig.items, ...eng.bars.flatMap((b) => b.items)].filter((it, i, a) => a.findIndex((x) => x.label === it.label) === i);
  const fixes = findFixes(place, report, all);
  const { pct } = visibility(report.answers);
  // In good shape: AI names them most of the time and Google basics are solid. Then the Autopilot leads.
  const strong = pct >= 50 && sig.score >= 80 && fixes.length <= 2;
  return { fixes, strong };
});

const REFUND = "14-day money-back promise.";

/**
 * The offer, on the first screen and before the slow checks finish, so buying never waits on
 * the AI answers or the Maps grid. Also mounts the sticky buy bar (phone and desktop).
 */
async function QuickOffer({ place, industry }: { place: Place; industry: IndustrySlug }) {
  return <QuickOfferView place={place} industry={industry} kit={await kitPrice()} />;
}

function QuickOfferView({ place, industry, kit }: { place: Place; industry: IndustrySlug; kit: KitPrice | null }) {
  const yearly = `${PRICES.yearly.label}/yr`;
  return (
    <section id="offer" aria-label="Fix it with the Launch Kit" className="card mt-6 border-ink p-5 outline outline-1 outline-ink sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">Fix everything this check finds, in one afternoon.</p>
          <p className="text-[0.95rem] text-ink-3">
            Launch Kit{kit ? ` · ${kit.label} one time` : ""}: every profile written for you, a verification coach and guided setup on 6 platforms.
          </p>
        </div>
        <div className="shrink-0 sm:max-w-[17rem]">
          <KitBuy kitLabel={kit?.label} monthlyLabel={PRICES.monthly.label} trialDays={KIT_TRIAL_DAYS} placeId={place.id} industry={industry} className="btn btn-accent w-full !min-h-[52px]" />
        </div>
      </div>
      <p className="mt-2 text-[0.88rem] text-ink-3">
        {kit && kit.leftAtPrice != null ? `${launchNote(kit)} ` : ""}
        Just want the weekly email?{" "}
        <BuyButton product="monthly" placeId={place.id} industry={industry} className="inline font-semibold text-ink-2 underline underline-offset-4">Autopilot {PRICES.monthly.label}/mo</BuyButton>
        {" or "}
        <BuyButton product="yearly" placeId={place.id} industry={industry} className="inline font-semibold text-ink-2 underline underline-offset-4">{yearly}</BuyButton>. {REFUND}
      </p>
      {kit ? <StickyBuyBar placeId={place.id} industry={industry} kitLabel={kit.label} monthlyLabel={PRICES.monthly.label} trialDays={KIT_TRIAL_DAYS} endsAt={dealOn() ? DEAL.endsAt : null} /> : null}
    </section>
  );
}

/** One line at the end of each section, pointing back to the offer. */
function KitLine({ children }: { children: React.ReactNode }) {
  return (
    <a href="#unlock" className="mt-4 inline-block font-semibold text-accent underline-offset-4 hover:underline">
      {children} →
    </a>
  );
}

/** Right under the score: the 3 biggest fixes from this check, and the button to fix them. */
async function TopFixes({ place, industry }: { place: Place; industry: IndustrySlug }) {
  const [{ fixes, strong }, kit] = await Promise.all([standing(place, industry), kitPrice()]);
  const top = fixes.slice(0, 3);
  return (
    <>
      <section id="fixes" aria-labelledby="fixes-h" className="card mt-6 scroll-mt-6 p-5 sm:p-7">
        <p className="eyebrow">{fixes.length ? `${fixes.length} ${fixes.length === 1 ? "fix" : "fixes"} found` : "No big gaps"}</p>
        <h2 id="fixes-h" className="font-display mt-2 text-[1.6rem] leading-snug sm:text-[1.9rem]">
          {top.length ? `Your top ${top.length === 1 ? "fix" : `${top.length} fixes`}` : "You're in good shape"}
        </h2>
        {top.length ? (
          <ol className="mt-4 space-y-4">
            {top.map((f, i) => (
              <li key={f.title} className="flex gap-3">
                <span className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-[0.95rem] text-ink-3">{f.why}</p>
                  <p className="mt-1 text-[0.88rem] font-semibold text-good">✓ Fixed in your Launch Kit</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-ink-2">AI assistants already name you and your listings line up. The Weekly Autopilot keeps it that way as rivals catch up.</p>
        )}
        {strong ? (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <BuyButton product="monthly" placeId={place.id} industry={industry} className="btn btn-accent w-full !min-h-[56px] sm:w-auto">
              Stay on top · {PRICES.monthly.label}/mo
            </BuyButton>
            <BuyButton product="yearly" placeId={place.id} industry={industry} className="link text-left">or {PRICES.yearly.label}/year{PRICES.yearly.save > 0 ? `, save $${PRICES.yearly.save}` : ""}</BuyButton>
            {top.length ? <BuyButton product="kit_only" placeId={place.id} industry={industry} className="link text-left">Or fix these once for {kit.label}</BuyButton> : null}
          </div>
        ) : (
          <div className="mt-6">
            <KitBuy kitLabel={kit.label} monthlyLabel={PRICES.monthly.label} trialDays={KIT_TRIAL_DAYS} placeId={place.id} industry={industry} className="btn btn-accent w-full !min-h-[56px] sm:w-auto" />
          </div>
        )}
        <p className="mt-3 text-[0.9rem] text-ink-3">
          {fixes.length > top.length ? `Your kit covers all ${fixes.length} fixes. ` : ""}{REFUND}
        </p>
      </section>
    </>
  );
}

async function Unlock({ place, industry, sharePath }: { place: Place; industry: IndustrySlug; sharePath: string }) {
  const [kit, { strong }] = await Promise.all([kitPrice(), standing(place, industry)]);
  const kitBtn = (
    <KitBuy kitLabel={kit.label} monthlyLabel={PRICES.monthly.label} trialDays={KIT_TRIAL_DAYS} placeId={place.id} industry={industry} dark className="btn btn-accent w-full !min-h-[56px] sm:w-auto" />
  );
  const autoBtn = (
    <BuyButton product="monthly" placeId={place.id} industry={industry} className="btn btn-accent w-full !min-h-[56px] sm:w-auto">
      Start the Weekly Autopilot · {PRICES.monthly.label}/mo
    </BuyButton>
  );
  return (
    <>
      <section id="unlock" aria-labelledby="unlock-h" className="mt-12 scroll-mt-6 rounded-3xl bg-ink p-6 text-paper sm:p-9">
        {strong ? (
          <>
            <p className="eyebrow !text-[#f0a37f]">The Weekly Autopilot</p>
            <h2 id="unlock-h" className="font-display mt-2 text-[1.9rem] leading-tight sm:text-[2.3rem]">You&apos;re ahead. Stay there.</h2>
            <ul className="mt-4 space-y-2 text-[#e3dccf]">
              <li>Every Monday: what AI assistants say about you and your rivals</li>
              <li>Rival moves, and what to do about them</li>
              <li>A Google post and review replies, written for you</li>
              <li>Local events to join, with the pitch written</li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              {autoBtn}
              <BuyButton product="yearly" placeId={place.id} industry={industry} className="text-left text-[#e3dccf] underline underline-offset-4">
                Or {PRICES.yearly.label}/year{PRICES.yearly.save > 0 ? `, save $${PRICES.yearly.save}` : ""}
              </BuyButton>
              <BuyButton product="kit_only" placeId={place.id} industry={industry} className="text-left text-[#e3dccf] underline underline-offset-4">
                Or get the one-time Launch Kit · {kit.label}
              </BuyButton>
            </div>
            <p className="mt-3 text-[0.9rem] text-[#bdb4a5]">Cancel any time. {REFUND} Secure checkout by Stripe.</p>
          </>
        ) : (
          <>
            <p className="eyebrow !text-[#f0a37f]">The Launch Kit</p>
            <h2 id="unlock-h" className="font-display mt-2 text-[1.9rem] leading-tight sm:text-[2.3rem]">Fix all of this in one afternoon.</h2>
            <ul className="mt-4 space-y-2 text-[#e3dccf]">
              <li>Your Google profile, written: categories, description, services, keywords, Q&A and 4 posts</li>
              <li>{place.id === "new" ? "Step-by-step help creating and verifying your Google profile" : "Verification and claiming coach"}</li>
              <li>Guided setup on Apple Maps, Bing, Yelp, Facebook and ChatGPT</li>
              <li>Your review link, a QR card to print, and ready-to-send review requests</li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
              {kitBtn}
              <BuyButton product="monthly" placeId={place.id} industry={industry} className="text-left text-[#e3dccf] underline underline-offset-4">
                Or keep watch weekly · {PRICES.monthly.label}/mo
              </BuyButton>
            </div>
            <p className="mt-3 text-[0.9rem] text-[#bdb4a5]">{kit.leftAtPrice != null ? `${launchNote(kit)} ` : ""}{REFUND} Secure checkout by Stripe.</p>
          </>
        )}
      </section>
      <section aria-labelledby="keep" className="card mt-10 p-5 sm:p-6">
        <h2 id="keep" className="font-semibold">Keep this report</h2>
        <p className="mt-1 text-[0.95rem] text-ink-3">We&apos;ll email you the link. No account needed.</p>
        <div className="mt-3"><EmailReport name={place.name} reportPath={sharePath} /></div>
        <div className="mt-4 flex flex-col items-start gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-2">Or share it with a partner or friend.</p>
          <CopyButton text={env.siteUrl + sharePath} label="Copy link to this check" />
        </div>
      </section>
      <p className="mt-6 text-[0.85rem] text-ink-3">AI answers change from day to day, so a single check is a snapshot. We refresh them every few days.</p>
    </>
  );
}

const PLATS: Platform[] = ["google", "yelp", "facebook"]; // Apple Maps and Bing Places can't be checked from outside

function RivalRow({ name, you, rating, reviews, ai, total, miles, profiles }: { name: string; you?: boolean; rating?: number; reviews: number; ai?: number; total: number; miles?: number; profiles: Partial<Record<Platform, boolean | null>> }) {
  return (
    <div className={`card p-4 ${you ? "border-ink outline outline-1 outline-ink" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{name}</p>
        {miles != null ? <p className="text-[0.85rem] text-ink-3">{miles} mi away</p> : null}
      </div>
      <dl className={`mt-2 grid gap-2 text-[0.92rem] ${ai == null ? "grid-cols-2" : "grid-cols-3"}`}>
        <div><dt className="text-ink-3">Rating</dt><dd className="font-semibold">{rating ? `★ ${rating}` : "None yet"}</dd></div>
        <div><dt className="text-ink-3">Reviews</dt><dd className="font-semibold">{reviews}</dd></div>
        {ai != null ? <div><dt className="text-ink-3">AI named</dt><dd className={`font-semibold ${ai === 0 ? "text-bad" : ""}`}>{ai} of {total}</dd></div> : null}
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
    </div>
  );
}
