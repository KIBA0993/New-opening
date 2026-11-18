"use client";
import { track } from "@vercel/analytics";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { DemoTag } from "@/components/ui";
import { reportPath, saveProfile } from "@/lib/clientProfile";
import type { IndustrySlug, OwnerProfile, Place } from "@/lib/types";
import { Details } from "./Details";

type Found = Place & { industryGuess?: IndustrySlug };
type Step = "loading" | "pick" | "notfound" | "details";

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
    // Only warn when the same name shows up twice at the same address. Same name at different
    // addresses is usually a brand with several locations, so the owner just picks theirs.
    const keys = results.map((r) => `${normalize(r.name)}|${normalize(r.address)}`);
    return keys.some((k, i) => keys.indexOf(k) !== i);
  }, [results]);

  const severalLocations = useMemo(() => {
    const names = results.map((r) => normalize(r.name));
    return names.length > 1 && names.some((n, i) => names.indexOf(n) !== i);
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
      // Asked later, inside the kit, where it matters. "unsure" shows both the edit and the claim steps.
      managesProfile: x.managesProfile || "unsure",
    }));
    setStep("details");
  }

  function back() {
    setStep(p.placeId === "new" && step === "details" ? "notfound" : "pick");
  }

  const [formError, setFormError] = useState("");

  async function finish(e: React.FormEvent, guard: { token: string; hp: string }) {
    e.preventDefault();
    if (!p.email || !p.industry || !p.name) return;
    setBusy(true);
    setFormError("");
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
    // Saves the lead and passes the invisible bot check, which the check page needs.
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, name: profile.name, reportPath: path, token: guard.token, company_site: guard.hp }),
    }).catch(() => null);
    if (res && res.status === 403) {
      setFormError("We couldn't confirm you're a person. Please try again.");
      setBusy(false);
      return false;
    }
    track("details", { industry: profile.industry });
    router.push(path);
    return true;
  }

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <h1 ref={heading} tabIndex={-1} className="no-ring font-display text-[2rem] leading-tight sm:text-[2.4rem]">
      {children}
    </h1>
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-8 pb-10 sm:pt-14">
      {step === "details" ? (
        <div className="mb-4">
          <button type="button" onClick={back} className="py-2 font-semibold text-ink-2 hover:text-ink">
            ← {p.placeId === "new" ? "Back" : "Not the right business?"}
          </button>
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
                <Heading>{results.length === 1 ? "Is this you?" : severalLocations ? "Pick your location" : "Which one is you?"}</Heading>
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
            setStep("details");
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

      {step === "details" && <Details p={p} setP={setP} place={place} busy={busy} onSubmit={finish} error={formError} />}
    </div>
  );
}
