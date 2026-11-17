"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { DemoTag } from "@/components/ui";
import { reportPath, saveProfile } from "@/lib/clientProfile";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import type { IndustrySlug, OwnerProfile, Place } from "@/lib/types";

type Found = Place & { industryGuess?: IndustrySlug };
type Step = "loading" | "pick" | "notfound" | "manage" | "industry" | "services" | "different" | "areas" | "email";

const QUESTION_STEPS: Step[] = ["manage", "industry", "services", "different", "areas", "email"];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function StartFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") || "";
  const placeParam = params.get("place");
  const token = params.get("token") || "";
  const presetIndustry = params.get("industry") as IndustrySlug | null;

  const [step, setStep] = useState<Step>(q || placeParam ? "loading" : "pick");
  const [results, setResults] = useState<Found[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [place, setPlace] = useState<Found | null>(null);
  const [p, setP] = useState<Partial<OwnerProfile>>({ industry: presetIndustry || undefined });
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to each new question for screen readers and keyboards.
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError("");
      try {
        if (placeParam) {
          const res = await fetch(`/api/places/${encodeURIComponent(placeParam)}?token=${token}`);
          const data = await res.json();
          if (cancelled) return;
          if (data.place) {
            setResults([data.place]);
            setDemo(placeParam.startsWith("demo_"));
            setStep("pick");
          } else setStep("notfound");
        } else if (q) {
          const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (cancelled) return;
          if (data.error) setError(data.error);
          setDemo(!!data.demo);
          setResults(data.places || []);
          if (!data.places?.length) setP((x) => ({ ...x, placeId: "new", name: x.name || (/^[\d\s()+.-]+$/.test(q) ? "" : q), phone: /^[\d\s()+.-]+$/.test(q) ? q : x.phone }));
          setStep(data.places?.length ? "pick" : "notfound");
        }
      } catch {
        if (!cancelled) {
          setError("We couldn't reach Google just now. Please try again.");
          setStep("pick");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [q, placeParam, token]);

  const possibleDuplicate = useMemo(() => {
    if (results.length < 2) return false;
    const names = results.map((r) => normalize(r.name));
    return names.some((n, i) => names.findIndex((m) => m === n) !== i);
  }, [results]);

  function choose(r: Found) {
    setPlace(r);
    setP((x) => ({
      ...x,
      placeId: r.id,
      name: r.name,
      address: r.address,
      city: r.city || r.address.split(",").slice(-3, -1).join(",").trim() || r.address,
      phone: r.phone,
      website: r.website,
      industry: x.industry || r.industryGuess,
      areas: x.areas || (r.city ? r.city.split(",")[0] : ""),
    }));
    setStep("manage");
  }

  const industry = industryBySlug(p.industry);
  const qIndex = QUESTION_STEPS.indexOf(step);
  const totalQ = p.placeId === "new" ? QUESTION_STEPS.length - 1 : QUESTION_STEPS.length;
  const qNumber = p.placeId === "new" ? qIndex : qIndex + 1;

  function back() {
    const prev: Partial<Record<Step, Step>> = {
      manage: "pick",
      industry: p.placeId === "new" ? "notfound" : "manage",
      services: "industry",
      different: "services",
      areas: "different",
      email: "areas",
    };
    setStep(prev[step] || "pick");
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    if (!p.email || !p.industry || !p.name) return;
    setBusy(true);
    const profile: OwnerProfile = {
      placeId: p.placeId || "new",
      name: p.name,
      address: p.address || "",
      city: p.city || "",
      phone: p.phone,
      website: p.website,
      industry: p.industry,
      managesProfile: p.managesProfile || "unsure",
      services: p.services || "",
      different: p.different || "",
      areas: p.areas || "",
      email: p.email,
    };
    saveProfile(profile);
    const path = reportPath(profile);
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, name: profile.name, reportPath: path }),
    }).catch(() => undefined);
    router.push(path);
  }

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <h1 ref={heading} tabIndex={-1} className="no-ring font-display text-[2rem] leading-tight sm:text-[2.4rem]">
      {children}
    </h1>
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-8 pb-10 sm:pt-14">
      {qIndex >= 0 ? (
        <div className="mb-6 flex items-center justify-between gap-4">
          <button type="button" onClick={back} className="py-2 font-semibold text-ink-2 hover:text-ink">
            ← Back
          </button>
          <div className="flex items-center gap-3 text-[0.9rem] text-ink-3" aria-label={`Question ${qNumber} of ${totalQ}`}>
            {qNumber} of {totalQ}
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-paper-3" aria-hidden>
              <span className="block h-full bg-ink transition-all" style={{ width: `${(qNumber / totalQ) * 100}%` }} />
            </span>
          </div>
        </div>
      ) : null}

      {step === "loading" && (
        <div role="status" aria-live="polite">
          <Heading>Looking you up on Google…</Heading>
          <div className="mt-6 space-y-3">
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
          </div>
        </div>
      )}

      {step === "pick" && (
        <>
          {results.length ? (
            <>
              <div className="flex items-center gap-3">
                <Heading>{results.length === 1 ? "Is this you?" : "Which one is you?"}</Heading>
                <DemoTag show={demo} />
              </div>
              {possibleDuplicate ? (
                <p className="mt-3 rounded-xl bg-warn-bg p-3 text-warn">
                  It looks like there may be more than one listing for your business. Duplicates can hurt how you show up. Your kit shows how to fix it.
                </p>
              ) : null}
              <ul className="mt-6 space-y-3">
                {results.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => choose(r)} className="card flex w-full gap-4 p-4 text-left hover:border-ink">
                      {r.photoName ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/photo?name=${encodeURIComponent(r.photoName)}`} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span aria-hidden className="font-display flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-paper-3 text-3xl text-ink-3">
                          {r.name[0]}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-[1.1rem] font-semibold">{r.name}</span>
                        <span className="block text-ink-3">{r.address}</span>
                        <span className="mt-1 block text-[0.9rem] text-ink-2">
                          {r.rating ? `★ ${r.rating} · ${r.reviewCount} reviews` : "No reviews yet"}
                          {r.primaryTypeLabel ? ` · ${r.primaryTypeLabel}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setP((x) => ({ ...x, name: q.replace(/^[\d\s()+.-]+$/, ""), placeId: "new" }));
                  setStep("notfound");
                }}
                className="mt-4 py-2 font-semibold text-accent-ink underline underline-offset-4"
              >
                None of these. I'm not on Google yet.
              </button>
            </>
          ) : (
            <>
              <Heading>Let's find your business</Heading>
              <p className="mt-2 text-ink-2">Type its name, address or phone number.</p>
              {error ? <p role="alert" className="mt-3 rounded-xl bg-bad-bg p-3 text-bad">{error}</p> : null}
              <div className="mt-6">
                <SearchBox industry={presetIndustry || undefined} autoFocus size="md" />
              </div>
            </>
          )}
        </>
      )}

      {step === "notfound" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setP((x) => ({ ...x, placeId: "new", managesProfile: "none", areas: x.areas || (x.city || "").split(",")[0] }));
            setStep("industry");
          }}
        >
          <Heading>You're not on Google yet. That's fine.</Heading>
          <p className="mt-3 text-ink-2">
            Your kit will start with creating your Google profile. Tell us your business name and city so we can check who shows up near you.
          </p>
          <label className="mt-6 block font-semibold" htmlFor="nf-name">Business name</label>
          <input id="nf-name" required className="field mt-2" value={p.name || ""} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="organization" />
          <label className="mt-4 block font-semibold" htmlFor="nf-city">City and state</label>
          <input id="nf-city" required className="field mt-2" placeholder="Austin, TX" value={p.city || ""} onChange={(e) => setP({ ...p, city: e.target.value, address: e.target.value })} autoComplete="address-level2" />
          <label className="mt-4 block font-semibold" htmlFor="nf-phone">Business phone <span className="font-normal text-ink-3">(optional)</span></label>
          <input id="nf-phone" type="tel" className="field mt-2" value={p.phone || ""} onChange={(e) => setP({ ...p, phone: e.target.value })} autoComplete="tel" />
          <button className="btn btn-primary mt-6 w-full">Continue</button>
          <p className="mt-6 text-ink-3">
            Already created a Google profile? New ones can take a few days to show up.{" "}
            <button type="button" className="link" onClick={() => router.push(`/start?q=${encodeURIComponent(p.name || q)}`)}>
              Check again
            </button>
          </p>
        </form>
      )}

      {step === "manage" && place && (
        <>
          <Heading>Do you manage this Google profile?</Heading>
          <p className="mt-3 text-ink-2">
            Google doesn't show us who controls <b>{place.name}</b>. If you can't sign in and edit it, your kit will start with claiming it.
          </p>
          <div className="mt-6 grid gap-3">
            {(
              [
                ["yes", "Yes, I can sign in and edit it"],
                ["no", "No, or someone else set it up"],
                ["unsure", "I'm not sure"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setP({ ...p, managesProfile: v });
                  setStep("industry");
                }}
                className="card p-4 text-left text-[1.05rem] font-semibold hover:border-ink"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === "industry" && (
        <>
          <Heading>What kind of business is it?</Heading>
          <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Business type">
            {INDUSTRIES.map((i) => (
              <button
                key={i.slug}
                type="button"
                role="radio"
                aria-checked={p.industry === i.slug}
                onClick={() => {
                  setP({ ...p, industry: i.slug });
                  setStep("services");
                }}
                className={`card p-4 text-left hover:border-ink ${p.industry === i.slug ? "border-ink outline outline-1 outline-ink" : ""}`}
              >
                <span className="block font-semibold">{i.name}</span>
                <span className="block text-[0.9rem] text-ink-3">{i.who[0].toUpperCase() + i.who.slice(1)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "services" && industry && (
        <form onSubmit={(e) => { e.preventDefault(); setStep("different"); }}>
          <Heading>{industry.menuWord === "menu" ? "What's on your menu?" : "What do you offer?"}</Heading>
          <p className="mt-3 text-ink-2">List your main {industry.menuWord === "menu" ? "dishes or drinks" : "services"}. Short is fine. We'll write it up properly.</p>
          <label htmlFor="svc" className="sr-only">{industry.menuWord}</label>
          <textarea id="svc" required rows={4} maxLength={480} className="field mt-6" placeholder={industry.servicesPlaceholder} value={p.services || ""} onChange={(e) => setP({ ...p, services: e.target.value })} />
          <button className="btn btn-primary mt-6 w-full">Continue</button>
        </form>
      )}

      {step === "different" && industry && (
        <form onSubmit={(e) => { e.preventDefault(); setStep("areas"); }}>
          <Heading>Why do customers pick you?</Heading>
          <p className="mt-3 text-ink-2">What makes you different from the place down the street? A few words is plenty.</p>
          <label htmlFor="diff" className="sr-only">What makes you different</label>
          <textarea id="diff" rows={3} maxLength={480} className="field mt-6" placeholder={industry.differentPlaceholder} value={p.different || ""} onChange={(e) => setP({ ...p, different: e.target.value })} />
          <button className="btn btn-primary mt-6 w-full">Continue</button>
          <button type="button" onClick={() => setStep("areas")} className="mt-3 w-full py-2 text-ink-3 underline underline-offset-4">Skip for now</button>
        </form>
      )}

      {step === "areas" && industry && (
        <form onSubmit={(e) => { e.preventDefault(); setStep("email"); }}>
          <Heading>{industry.serviceArea ? "Which areas do you serve?" : "Which neighborhoods are your customers from?"}</Heading>
          <p className="mt-3 text-ink-2">Neighborhoods or towns, separated by commas. These go into your profiles so locals find you.</p>
          <label htmlFor="areas" className="sr-only">Areas</label>
          <input id="areas" required maxLength={480} className="field mt-6" placeholder="East Austin, Mueller, Hyde Park" value={p.areas || ""} onChange={(e) => setP({ ...p, areas: e.target.value })} />
          <button className="btn btn-primary mt-6 w-full">Continue</button>
        </form>
      )}

      {step === "email" && (
        <form onSubmit={finish}>
          <Heading>Where should we send your results?</Heading>
          <p className="mt-3 text-ink-2">We'll email you a link to your check so you can come back to it. No spam.</p>
          <label htmlFor="email" className="mt-6 block font-semibold">Email</label>
          <input id="email" type="email" required autoComplete="email" inputMode="email" className="field mt-2" value={p.email || ""} onChange={(e) => setP({ ...p, email: e.target.value })} />
          <button className="btn btn-accent mt-6 w-full !min-h-[56px] text-[1.05rem]" disabled={busy}>
            {busy ? "Starting your check…" : "Run my free check"}
          </button>
          <p className="mt-3 text-[0.9rem] text-ink-3">We'll ask AI assistants about businesses like yours near you. It takes about 30 seconds.</p>
        </form>
      )}
    </div>
  );
}
