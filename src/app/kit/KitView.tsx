"use client";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { CopyBlock, CopyButton } from "@/components/CopyButton";
import { DemoTag } from "@/components/ui";
import type { Directory } from "@/lib/directories";
import type { PlatformGuide } from "@/lib/platforms";
import type { LaunchKit, OwnerProfile } from "@/lib/types";

interface Props {
  kit: LaunchKit;
  profile: OwnerProfile;
  guides: PlatformGuide[];
  reviewUrl: string;
  serviceArea: boolean;
  storeKey: string;
  industryName: string;
  directories: Directory[];
  schema: string;
  robots: string;
}

const STEP_IDS = ["details", "facts", "google", "verify", "apple", "bing", "yelp", "facebook", "chatgpt", "directories", "website", "reviews"] as const;
type StepId = (typeof STEP_IDS)[number];

export function KitView({ kit, profile, guides, reviewUrl, serviceArea, storeKey, industryName, directories, schema, robots }: Props) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [qr, setQr] = useState("");
  const key = `od_kit_${storeKey.slice(-24)}`;

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(key) || "{}"));
    } catch {
      /* ignore */
    }
  }, [key]);

  useEffect(() => {
    QRCode.toDataURL(reviewUrl, { width: 640, margin: 1, color: { dark: "#1c1a16", light: "#ffffff" } }).then(setQr).catch(() => setQr(""));
  }, [reviewUrl]);

  function toggle(id: StepId) {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const count = STEP_IDS.filter((s) => done[s]).length;
  const isNew = profile.placeId === "new";
  const claimFirst = profile.managesProfile === "no" || profile.managesProfile === "unsure";
  const fill = (s: string) => (reviewUrl.includes("YOUR_PLACE_ID") ? s : s.replaceAll("[REVIEW LINK]", reviewUrl));

  const fields = useMemo(
    () => ({
      name: { label: "Business name", value: profile.name, hint: "Use exactly this. No extra keywords, or Google may suspend you." },
      address: serviceArea
        ? { label: "Areas you serve", value: profile.areas || profile.city, hint: "Hide your street address if customers don't come to you." }
        : { label: "Address", value: profile.address, hint: "" },
      phone: { label: "Phone", value: profile.phone || "Add your business phone", hint: "A local number, the same everywhere." },
      website: { label: "Website", value: profile.website || "No website yet? Leave it blank for now.", hint: "" },
      category: { label: "Category", value: kit.primaryCategory, hint: "Pick the closest match the platform offers." },
      short: { label: "Short description", value: kit.shortDescription, hint: "" },
      description: { label: "Description", value: kit.description, hint: "" },
      services: { label: "Services", value: kit.services.map((s) => `${s.name}: ${s.description}`).join("\n"), hint: "" },
    }),
    [profile, kit, serviceArea],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-10 sm:px-6 sm:pt-12">
      <div className="print:hidden">
        <p className="eyebrow">Your Launch Kit</p>
        <h1 className="font-display mt-2 text-[2.2rem] leading-tight sm:text-[2.8rem]">{profile.name}</h1>
        <p className="mt-2 text-ink-2">
          Go step by step. Tap <b>Copy</b>, paste it where we tell you, and mark the step done. Most owners finish in one afternoon.
        </p>
        <div className="sticky top-0 z-10 -mx-4 mt-6 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold" aria-live="polite">
              {count} of {STEP_IDS.length} steps done
            </p>
            <DemoTag show={kit.demo} />
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-3" aria-hidden>
            <div className="h-full bg-good transition-all" style={{ width: `${(count / STEP_IDS.length) * 100}%` }} />
          </div>
        </div>

        <Step n={1} id="details" title="Your details, the same everywhere" done={done.details} onToggle={toggle}
          intro="AI tools trust businesses whose name, address and phone match on every site. Use these exact details everywhere.">
          <div className="grid gap-3">
            {(["name", "address", "phone", "website"] as const).map((f) => (
              <CopyBlock key={f} label={fields[f].label} text={fields[f].value} hint={fields[f].hint} />
            ))}
          </div>
        </Step>

        <Step n={2} id="facts" title="Your proof: credentials, facts and prices" done={done.facts} onToggle={toggle}
          intro="AI assistants recommend the business that proves it does the exact job, with specifics like licenses, areas and prices. Fill in the [brackets], then use the same facts on every listing and on your website.">
          <div className="grid gap-3">
            {kit.facts?.length ? <CopyBlock label="Fact sheet" text={kit.facts.join("\n")} hint="Fill in every [bracket]. Never claim a license or number you don't have." /> : null}
            {kit.priceMenu?.length ? (
              <CopyBlock label={industryName.toLowerCase().includes("restaurant") || industryName.toLowerCase().includes("food") ? "Menu with prices" : "Price list"} text={kit.priceMenu.map((x) => `${x.item}: ${x.price}`).join("\n")} hint="Put this on your website and in your Google services. Even 'from $X' lets AI answer 'how much' questions with your name." />
            ) : null}
            {!kit.facts?.length && !kit.priceMenu?.length ? <p className="text-ink-2">List your licenses, insurance, certifications and starting prices in one place, and use the same wording everywhere.</p> : null}
          </div>
        </Step>

        <Step n={3} id="google" title={isNew ? "Create your Google profile" : claimFirst ? "Claim your Google profile, then fill it in" : "Fill in your Google profile"} done={done.google} onToggle={toggle}
          intro={guides[0].why}>
          {claimFirst && !isNew ? (
            <div className="mb-5 rounded-xl bg-warn-bg p-4 text-warn">
              <p className="font-semibold">First, get access.</p>
              <p className="mt-1">
                Search for {profile.name} on Google Business Profile and choose &ldquo;Request access&rdquo; (or &ldquo;Claim this business&rdquo;). If someone else set it up, Google emails them and gives you access if they don&apos;t answer within a few days.
              </p>
            </div>
          ) : null}
          <Guide guide={guides[0]} />
          <div className="mt-5 grid gap-3">
            <CopyBlock label="Primary category" text={kit.primaryCategory} hint="Your most important choice. Choose this one first." />
            <CopyBlock label="Secondary categories" text={kit.secondaryCategories.join("\n")} hint="Add these after you're verified." />
            <CopyBlock label="Description" text={kit.description} hint={`${kit.description.length} of 750 characters`} />
            <div className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">Services</p>
                <CopyButton text={kit.services.map((s) => `${s.name}\n${s.description}`).join("\n\n")} label="Copy all" />
              </div>
              <ul className="mt-3 space-y-3">
                {kit.services.map((s) => (
                  <li key={s.name} className="flex items-start justify-between gap-3 border-t border-line pt-3">
                    <span>
                      <span className="block font-semibold">{s.name}</span>
                      <span className="text-ink-2">{s.description}</span>
                    </span>
                    <CopyButton text={`${s.name}\n${s.description}`} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <p className="font-semibold">Questions and answers</p>
              <p className="text-[0.85rem] text-ink-3">Post these from your own Google account under &ldquo;Questions&rdquo;, then answer them as the owner.</p>
              <ul className="mt-3 space-y-3">
                {kit.qa.map((x) => (
                  <li key={x.q} className="border-t border-line pt-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">{x.q}</p>
                      <CopyButton text={x.q} label="Copy question" />
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-3">
                      <p className="text-ink-2">{x.a}</p>
                      <CopyButton text={x.a} label="Copy answer" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <p className="font-semibold">Your first 4 posts</p>
              <p className="text-[0.85rem] text-ink-3">Post one a week, with a photo. Fresh posts tell Google and AI tools you&apos;re active.</p>
              <ol className="mt-3 space-y-3">
                {kit.posts.map((x, i) => (
                  <li key={x.title} className="border-t border-line pt-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">Week {i + 1}: {x.title}</p>
                      <CopyButton text={x.body} />
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-ink-2">{x.body}</p>
                  </li>
                ))}
              </ol>
            </div>
            <CopyBlock label="Keywords customers use" text={kit.keywords.join(", ")} hint="Use these naturally in posts and replies. Never add them to your business name." />
          </div>
        </Step>

        <Step n={4} id="verify" title="Pass Google's verification" done={done.verify} onToggle={toggle}
          intro="Google decides how to verify you: a video, a phone or text code, an email, or a postcard. Video is the most common now and the one people fail most.">
          <VerificationCoach serviceArea={serviceArea} industryName={industryName} />
        </Step>

        {guides.slice(1).map((g, i) => (
          <Step key={g.platform} n={5 + i} id={g.platform as StepId} title={`Get on ${g.name}`} done={done[g.platform]} onToggle={toggle} intro={g.why}>
            <Guide guide={g} />
            <div className="mt-5 grid gap-3">
              {g.fields.map((f) => (
                <CopyBlock key={f} label={fields[f].label} text={fields[f].value} hint={fields[f].hint} />
              ))}
              {g.platform === "yelp" && kit.yelp ? (
                <>
                  <CopyBlock label="Specialties" text={kit.yelp.specialties} hint="Name every service in plain words. ChatGPT reads this field." />
                  <CopyBlock label="History" text={kit.yelp.history} hint="Fill in any [brackets] with your own story." />
                </>
              ) : null}
            </div>
          </Step>
        ))}

        <Step n={5 + guides.length - 1} id="directories" title={`Get on your industry's directories`} done={done.directories} onToggle={toggle}
          intro={`ChatGPT cites directories and "best of" lists in most local answers. These are the ones that matter for ${industryName.toLowerCase()}. Use the same details and fact sheet on each.`}>
          <ul className="grid gap-3">
            {directories.map((d) => (
              <li key={d.name} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block font-semibold">{d.name}</span>
                  <span className="text-[0.95rem] text-ink-2">{d.why}</span>
                </span>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-[44px]">Open {d.name} ↗</a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-3">
            <CopyBlock label="Short description for directories" text={kit.shortDescription} />
            <CopyBlock label="Services" text={fields.services.value} />
          </div>
        </Step>

        <Step n={6 + guides.length - 1} id="website" title="Make your website easy for AI to quote" done={done.website} onToggle={toggle}
          intro="Gemini and Perplexity cite business websites in about 9 of 10 local answers. A page per service is what wins specific questions, even against bigger rivals. Send this step to whoever runs your site, or paste it into your site builder.">
          <div className="grid gap-3">
            {kit.servicePages?.length ? (
              <div className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">One page per service</p>
                  <CopyButton text={kit.servicePages.map((x) => `${x.title}\n/${x.slug}\n\n${x.body}`).join("\n\n---\n\n")} label="Copy all" />
                </div>
                <p className="text-[0.85rem] text-ink-3">Use the title as the page heading and the address shown as the page link. Fill in the [brackets].</p>
                <ul className="mt-3 space-y-3">
                  {kit.servicePages.map((x) => (
                    <li key={x.slug} className="border-t border-line pt-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold">{x.title} <span className="font-normal text-ink-3">/{x.slug}</span></p>
                        <CopyButton text={`${x.title}\n\n${x.body}`} />
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-ink-2">{x.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {kit.areaPage ? <CopyBlock label={`Areas page: ${kit.areaPage.title} (/${kit.areaPage.slug})`} text={kit.areaPage.body} /> : null}
            <CopyBlock label="FAQ page" text={kit.qa.map((x) => `${x.q}\n${x.a}`).join("\n\n")} hint="The same questions as your Google profile, as one page on your site." />
            <CopyBlock label="Business schema (paste into your site's <head>)" text={schema} hint="Tells AI your name, phone, area and services without guessing. Most site builders have a 'custom code' or 'header code' box." />
            <CopyBlock label="robots.txt lines for AI search" text={robots} hint="Add these to your robots.txt so ChatGPT, Perplexity, Gemini and Claude can read and cite your site." />
          </div>
        </Step>

        <Step n={7 + guides.length - 1} id="reviews" title="Get your first 10 reviews" done={done.reviews} onToggle={toggle}
          intro="New businesses with a handful of recent reviews start showing up fast. Ask every happy customer, right after the visit, and ask them to mention the service and their neighborhood: AI picks the business whose reviews prove it does the exact job.">
          {reviewUrl.includes("YOUR_PLACE_ID") ? (
            <p className="mb-3 rounded-xl bg-warn-bg p-4 text-warn">
              Your review link works once your Google profile is live. In your Business Profile, tap &ldquo;Ask for reviews&rdquo; to get your own short link, and use it in the messages below.
            </p>
          ) : (
            <CopyBlock label="Your Google review link" text={reviewUrl} hint="Opens the review box directly on Google." />
          )}
          {qr && !reviewUrl.includes("YOUR_PLACE_ID") ? (
            <div className="card mt-3 flex flex-col items-center gap-4 p-5 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR code that opens the Google review page for ${profile.name}`} className="h-40 w-40" />
              <div>
                <p className="font-semibold">QR code for your counter, mirror or truck window</p>
                <p className="text-ink-2">Print the card, or save the image for flyers and receipts.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => window.print()} className="btn btn-primary !min-h-[44px]">Print a review card</button>
                  <a href={qr} download={`${profile.name.replace(/\W+/g, "-")}-review-qr.png`} className="btn btn-ghost !min-h-[44px]">Save QR image</a>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-3 grid gap-3">
            <CopyBlock label="Text message" text={fill(kit.reviewRequest.sms)} />
            <CopyBlock label="Email" text={fill(kit.reviewRequest.email)} />
            <CopyBlock label="What to say in person" text={kit.reviewRequest.inPerson} />
          </div>
          <p className="mt-4 rounded-xl bg-paper-3 p-4 text-ink-2">
            <b>Two rules:</b> never offer discounts or gifts for reviews, and don&apos;t ask for reviews on Yelp. Both break the platforms&apos; rules and can get reviews removed.
          </p>
        </Step>

        <section className="mt-14 rounded-3xl bg-ink p-6 text-paper sm:p-9">
          <h2 className="font-display text-[1.8rem] leading-tight">Done setting up? Now stay found.</h2>
          <p className="mt-2 text-[#d9d1c3]">
            Most owners set up their profile once and never touch it again. The Weekly Autopilot sends you one email each Monday: whether AI tools are naming you yet, what your rivals did, a post and review replies ready to paste, and local events worth joining.
          </p>
          <Link href="/autopilot" className="btn btn-accent mt-5">See a sample email</Link>
        </section>
      </div>

      {/* Printable review card */}
      <div className="hidden print:block">
        <div className="mx-auto mt-10 w-[4in] rounded-2xl border-2 border-black p-6 text-center">
          <p className="font-display text-2xl">Enjoyed your visit?</p>
          <p className="mt-1">Scan to leave {profile.name} a quick Google review.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="" className="mx-auto mt-4 h-56 w-56" /> : null}
          <p className="mt-3 text-sm">Thank you for supporting a new local business.</p>
        </div>
      </div>
    </div>
  );
}

function Step({ n, id, title, intro, done, onToggle, children }: { n: number; id: StepId; title: string; intro?: string; done?: boolean; onToggle: (id: StepId) => void; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-12 scroll-mt-28">
      <div className="flex items-start gap-4">
        <span aria-hidden className={`font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${done ? "bg-good text-white" : "border border-ink"}`}>
          {done ? "✓" : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-h`} className="font-display text-[1.6rem] leading-tight">{title}</h2>
          {intro ? <p className="mt-1 text-ink-2">{intro}</p> : null}
        </div>
      </div>
      <div className="mt-5 sm:pl-14">
        {done ? <p className="text-ink-3">Done. Uncheck the box to see this step again.</p> : children}
        <label className="mt-5 flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper-2 px-4 font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-[#2f6b45]" checked={!!done} onChange={() => onToggle(id)} />
          Mark this step done
        </label>
      </div>
    </section>
  );
}

function Guide({ guide }: { guide: PlatformGuide }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">About {guide.minutes} minutes</p>
        <a href={guide.url} target="_blank" rel="noopener noreferrer" className="btn btn-accent !min-h-[44px]">
          Open {guide.name} ↗
        </a>
      </div>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-2 marker:font-semibold marker:text-ink">
        {guide.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {guide.note ? <p className="mt-4 rounded-xl bg-warn-bg p-3 text-[0.95rem] text-warn">{guide.note}</p> : null}
    </div>
  );
}

function VerificationCoach({ serviceArea, industryName }: { serviceArea: boolean; industryName: string }) {
  const shots = serviceArea
    ? [
        "Start outside: show a street sign or landmark so Google can see the area you work in.",
        "Show your vehicle with your business name on it (a magnet sign counts), or your branded gear.",
        "Show the tools and equipment you use for the job.",
        "Show proof you run the business: a business license, invoice, or utility bill with the business name.",
        "If you have branded uniforms, cards or flyers, show those too.",
      ]
    : [
        "Start outside: show the street and nearby businesses, then your sign with your business name.",
        "Walk in without stopping the recording, so it's clear the sign and the inside are the same place.",
        `Show what you sell or do: your ${industryName.toLowerCase().includes("restaurant") ? "kitchen and menu" : "chairs, equipment or products"}.`,
        "Show proof you run it: unlock a door or register, or show a business license or utility bill with the business name.",
      ];
  const tips = [
    "One continuous video, no cuts or edits, about one to two minutes.",
    "Film in daylight and keep the camera steady. Normal phone video quality is fine.",
    "Your business name must match your sign, vehicle or documents exactly.",
    "Upload it from the Google Maps app or your Business Profile when Google asks for a video.",
    "Don't change your name, address or category while verification is pending.",
  ];
  return (
    <div className="grid gap-4">
      <div className="card p-4 sm:p-5">
        <p className="font-semibold">What to film{serviceArea ? " (businesses that go to customers)" : " (businesses with a location)"}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-2 marker:font-semibold marker:text-ink">
          {shots.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="card p-4 sm:p-5">
        <p className="font-semibold">Tips that help it pass</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-2">
          {tips.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="card p-4 sm:p-5">
        <p className="font-semibold">If it gets rejected</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-2 marker:font-semibold marker:text-ink">
          <li>Read the reason Google gives. It usually says what was missing.</li>
          <li>Film again and fix only that part. Most second tries pass.</li>
          <li>Still stuck? Ask Google for another way to verify from the Business Profile help page, and keep your documents ready.</li>
        </ol>
      </div>
      <p className="rounded-xl bg-paper-3 p-4 text-ink-2">
        <b>After you&apos;re verified:</b> make your remaining edits in one sitting, then leave it alone for a few weeks. Check weekly for &ldquo;suggested edits&rdquo; from the public, because Google can apply them automatically.
      </p>
    </div>
  );
}
