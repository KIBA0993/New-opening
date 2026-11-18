"use client";
import { useEffect, useRef, useState } from "react";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import type { IndustrySlug, OwnerProfile, Place } from "@/lib/types";

type Draft = Partial<OwnerProfile>;

const split = (s: string) =>
  s
    .split(/[,.]+/)
    .map((x) => x.trim())
    .filter((x) => x && x.length < 60);

/** Industry starting point, shown instantly before the AI suggestion arrives. */
function template(slug: IndustrySlug | undefined, city?: string) {
  const ind = industryBySlug(slug);
  return { services: ind ? [...ind.starterServices] : [], areas: city ? city.split(",")[0].trim() : "" };
}

/** Editable list of short items (services or menu items). */
function Chips({ items, onChange, label, placeholder }: { items: string[]; onChange: (v: string[]) => void; label: string; placeholder: string }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (v && !items.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...items, ...split(v).slice(0, 8)]);
    setDraft("");
  }
  return (
    <div>
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        {items.map((s) => (
          <li key={s} className="flex items-center gap-1 rounded-full border border-line bg-paper-2 py-1 pr-1 pl-3 text-[0.97rem]">
            {s}
            <button type="button" onClick={() => onChange(items.filter((x) => x !== s))} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-paper-3 hover:text-ink" aria-label={`Remove ${s}`}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <label htmlFor="add-svc" className="sr-only">Add another</label>
        <input
          id="add-svc"
          className="field !mt-0 flex-1"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className="btn btn-ghost shrink-0" disabled={!draft.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

/**
 * The one onboarding screen after picking the business: everything prefilled from Google
 * (and an AI guess), so most owners just check it, add their email and go.
 */
export function Details({
  p,
  setP,
  place,
  busy,
  onSubmit,
}: {
  p: Draft;
  setP: (fn: (x: Draft) => Draft) => void;
  place: (Place & { industryGuess?: IndustrySlug }) | null;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const t0 = template(p.industry, p.city);
  const [services, setServices] = useState<string[]>(p.services ? split(p.services) : t0.services);
  const [loading, setLoading] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [more, setMore] = useState(!!p.different);
  const touched = useRef({ services: !!p.services, areas: false, different: !!p.different });
  const industry = industryBySlug(p.industry);

  // Keep the profile's services string in sync with the chips.
  useEffect(() => {
    setP((x) => ({ ...x, services: services.join(", ") }));
  }, [services, setP]);

  // Ask for a tailored guess whenever the business type is set or changed.
  useEffect(() => {
    if (!p.industry || !p.name) return;
    let cancelled = false;
    setLoading(true);
    if (!touched.current.services) setServices(template(p.industry, p.city).services);
    fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: p.placeId || "new",
        name: p.name,
        address: p.address || "",
        city: p.city || "",
        industry: p.industry,
        typeLabel: place?.primaryTypeLabel,
        types: place?.types?.slice(0, 20),
        website: p.website,
      }),
    })
      .then((r) => r.json())
      .then((s: { services?: string[]; different?: string; areas?: string[]; ai?: boolean }) => {
        if (cancelled) return;
        if (!touched.current.services && s.services?.length) setServices(s.services);
        setP((x) => ({
          ...x,
          areas: !touched.current.areas && s.areas?.length ? s.areas.join(", ") : x.areas,
          different: !touched.current.different && s.different ? s.different : x.different,
        }));
        setAiFilled(!!s.ai);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.industry]);

  const menu = industry?.menuWord === "menu";

  return (
    <form onSubmit={onSubmit}>
      <h1 tabIndex={-1} className="no-ring font-display text-[2rem] leading-tight sm:text-[2.4rem]">
        {place ? "We filled this in from Google" : "Tell us a little more"}
      </h1>
      <p className="mt-2 text-ink-2">Check it, change anything that's off, and run your check.</p>

      <div className="card mt-5 flex items-center gap-3 p-3">
        <span aria-hidden className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper-3 text-2xl text-ink-3">{p.name?.[0]}</span>
        <span className="min-w-0">
          <span className="block font-semibold">{p.name}</span>
          <span className="block truncate text-[0.92rem] text-ink-3">{p.address || p.city}</span>
        </span>
      </div>

      <fieldset className="mt-7">
        <legend className="font-semibold">Type of business</legend>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Type of business">
          {INDUSTRIES.map((i) => {
            const on = p.industry === i.slug;
            return (
              <button
                key={i.slug}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setP((x) => ({ ...x, industry: i.slug }))}
                className={`min-h-[44px] rounded-full border px-4 text-[0.97rem] ${on ? "border-ink bg-ink text-paper" : "border-line bg-paper-2 hover:border-ink"}`}
              >
                {i.name}
              </button>
            );
          })}
        </div>
        {place?.primaryTypeLabel ? <p className="mt-2 text-[0.9rem] text-ink-3">Google lists you as &ldquo;{place.primaryTypeLabel}&rdquo;.</p> : null}
      </fieldset>

      {industry ? (
        <>
          <div className="mt-7">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold">{menu ? "What's on your menu" : "What you offer"}</p>
              <p className="text-[0.85rem] text-ink-3" aria-live="polite">
                {loading ? "Filling in from your listing…" : aiFilled && !touched.current.services ? "Suggested. Edit freely." : ""}
              </p>
            </div>
            <div className={`mt-3 ${loading && !touched.current.services ? "opacity-60" : ""}`}>
              <Chips
                items={services}
                label={menu ? "Menu items" : "Services"}
                placeholder={menu ? "Add a dish or drink" : "Add a service"}
                onChange={(v) => {
                  touched.current.services = true;
                  setServices(v);
                }}
              />
            </div>
          </div>

          <div className="mt-7">
            <label htmlFor="areas" className="font-semibold">{industry.serviceArea ? "Areas you serve" : "Where your customers come from"}</label>
            <input
              id="areas"
              maxLength={480}
              className="field mt-2"
              placeholder="East Austin, Mueller, Hyde Park"
              value={p.areas || ""}
              onChange={(e) => {
                touched.current.areas = true;
                const areas = e.target.value;
                setP((x) => ({ ...x, areas }));
              }}
            />
          </div>

          {more ? (
            <div className="mt-7">
              <label htmlFor="diff" className="font-semibold">Why customers pick you <span className="font-normal text-ink-3">(optional)</span></label>
              <textarea
                id="diff"
                rows={2}
                maxLength={480}
                className="field mt-2"
                placeholder={industry.differentPlaceholder}
                value={p.different || ""}
                onChange={(e) => {
                  touched.current.different = true;
                  const different = e.target.value;
                  setP((x) => ({ ...x, different }));
                }}
              />
            </div>
          ) : (
            <button type="button" onClick={() => setMore(true)} className="mt-5 py-2 font-semibold text-accent-ink underline underline-offset-4">
              + Add why customers pick you (optional)
            </button>
          )}
        </>
      ) : null}

      <div className="mt-8 border-t border-line pt-6">
        <label htmlFor="email" className="font-semibold">Email for your results</label>
        <input id="email" type="email" required autoComplete="email" inputMode="email" className="field mt-2" placeholder="you@yourbusiness.com" value={p.email || ""} onChange={(e) => {
          const email = e.target.value;
          setP((x) => ({ ...x, email }));
        }} />
        <button className="btn btn-accent mt-5 w-full !min-h-[56px] text-[1.05rem]" disabled={busy || !p.industry || !services.length}>
          {busy ? "Starting your check…" : "Run my free check"}
        </button>
        <p className="mt-3 text-[0.9rem] text-ink-3">
          {!p.industry ? "Pick your type of business first. " : !services.length ? `Add at least one ${menu ? "menu item" : "service"}. ` : ""}
          We&apos;ll email you a link to your results. No spam.
        </p>
      </div>
    </form>
  );
}
