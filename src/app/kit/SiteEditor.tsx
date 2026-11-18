"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { SITE_URL } from "@/lib/site";
import type { LaunchKit, OwnerProfile } from "@/lib/types";

// The free one-page website editor in the Kit. Prefilled from the Kit; every [bracket] must be
// filled in or deleted before the page can go live.

export interface PublishedSite {
  slug: string;
  intro: string;
  phone: string;
  booking: string;
  services: { name: string; description: string }[];
  prices: { item: string; price: string }[];
  facts: string[];
  areas: string;
  hours: string;
  faq: { q: string; a: string }[];
}

const pairs = (s: string) =>
  s.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, ""];
  });
const faqParse = (s: string) =>
  s.split(/\n\s*\n/).map((b) => {
    const q = b.match(/^\s*Q:\s*([\s\S]*?)(?=\n\s*A:|$)/i)?.[1]?.trim() || "";
    const a = b.match(/\n\s*A:\s*([\s\S]*)$/i)?.[1]?.trim() || "";
    return { q, a };
  }).filter((x) => x.q && x.a);
const BRACKETS = /\[[^\]]{1,80}\]/g;

export function SiteEditor({ storeKey, kit, profile, initial, open }: { storeKey: string; kit: LaunchKit; profile: OwnerProfile; initial: PublishedSite | null; open: boolean }) {
  const base = profile.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const [f, setF] = useState(() => ({
    slug: initial?.slug || base || "my-business",
    intro: initial?.intro || kit.description,
    phone: initial?.phone ?? profile.phone ?? "",
    booking: initial?.booking || "",
    services: (initial?.services || kit.services).map((s) => `${s.name}: ${s.description}`).join("\n"),
    prices: (initial?.prices || kit.priceMenu || []).map((x) => `${x.item}: ${x.price}`).join("\n"),
    facts: (initial?.facts || kit.facts || []).join("\n"),
    areas: initial?.areas ?? (profile.areas || profile.city),
    hours: initial?.hours || "",
    faq: (initial?.faq || kit.qa).map((x) => `Q: ${x.q}\nA: ${x.a}`).join("\n\n"),
  }));
  const [live, setLive] = useState<string | null>(initial ? `${SITE_URL}/b/${initial.slug}` : null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const left = useMemo(() => {
    const out: string[] = [];
    for (const [k, label] of [["intro", "About"], ["phone", "Phone"], ["services", "Services"], ["prices", "Prices"], ["facts", "Good to know"], ["areas", "Areas"], ["hours", "Hours"], ["faq", "Questions"]] as const) {
      const n = (f[k].match(BRACKETS) || []).length;
      if (n) out.push(`${label} (${n})`);
    }
    return out;
  }, [f]);

  async function publish() {
    setBusy(true);
    setMsg(null);
    const site = {
      slug: f.slug,
      intro: f.intro,
      phone: f.phone,
      booking: f.booking.trim(),
      services: pairs(f.services).map(([name, description]) => ({ name, description })),
      prices: pairs(f.prices).filter(([, p]) => p).map(([item, price]) => ({ item, price })),
      facts: f.facts.split("\n").map((x) => x.trim()).filter(Boolean),
      areas: f.areas,
      hours: f.hours,
      faq: faqParse(f.faq),
    };
    const res = await fetch("/api/kit/site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish", key: storeKey, site }) }).catch(() => null);
    const data = res ? ((await res.json().catch(() => ({}))) as { url?: string; error?: string }) : { error: "No connection. Please try again." };
    setBusy(false);
    if (data.url) {
      setLive(data.url);
      setMsg({ ok: true, text: "Your page is live. It can take a few minutes for changes to show everywhere." });
    } else setMsg({ ok: false, text: data.error || "Something went wrong. Please try again." });
  }

  async function takeDown() {
    setBusy(true);
    await fetch("/api/kit/site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unpublish", key: storeKey }) }).catch(() => null);
    setBusy(false);
    setLive(null);
    setMsg({ ok: true, text: "Your page is taken down." });
  }

  const area = "field min-h-[7rem] w-full font-[inherit]";
  return (
    <details className="card p-4" open={open || !!initial}>
      <summary className="cursor-pointer font-semibold">
        {live ? "Your free MapDebut page is live" : profile.website ? "Or publish a free one-page website" : "No website yet? Publish a free page in 5 minutes"}
      </summary>
      <p className="mt-2 text-[0.95rem] text-ink-2">
        A real page at <b>{SITE_URL.replace(/^https?:\/\//, "")}/b/your-name</b> with your services, prices, areas and questions, plus the schema AI tools read. Put its address in the website box of your Google, Apple and Yelp listings. Fill in every [bracket] or delete that line first. Nothing goes live with a placeholder.
      </p>
      {live ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-good-bg p-3 text-good">
          <a href={live} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 [overflow-wrap:anywhere]">{live} ↗</a>
          <CopyButton text={live} label="Copy address" />
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="font-semibold">Page address</span>
          <span className="flex items-center gap-1 text-ink-3">
            <span className="shrink-0">/b/</span>
            <input value={f.slug} onChange={set("slug")} className="field w-full" autoCapitalize="none" spellCheck={false} />
          </span>
        </label>
        <label className="grid gap-1"><span className="font-semibold">About the business</span><textarea value={f.intro} onChange={set("intro")} className={area} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1"><span className="font-semibold">Phone</span><input value={f.phone} onChange={set("phone")} className="field" inputMode="tel" /></label>
          <label className="grid gap-1"><span className="font-semibold">Booking link (optional)</span><input value={f.booking} onChange={set("booking")} className="field" placeholder="https://" inputMode="url" /></label>
        </div>
        <label className="grid gap-1"><span className="font-semibold">Services</span><span className="text-[0.85rem] text-ink-3">One per line: Name: what's included</span><textarea value={f.services} onChange={set("services")} className={area} /></label>
        <label className="grid gap-1"><span className="font-semibold">Prices</span><span className="text-[0.85rem] text-ink-3">One per line: Item: price. Delete any line you don't want to show.</span><textarea value={f.prices} onChange={set("prices")} className={area} /></label>
        <label className="grid gap-1"><span className="font-semibold">Good to know</span><span className="text-[0.85rem] text-ink-3">Licenses, insurance, how booking works. One per line. Only what's true.</span><textarea value={f.facts} onChange={set("facts")} className={area} /></label>
        <label className="grid gap-1"><span className="font-semibold">Areas you serve</span><input value={f.areas} onChange={set("areas")} className="field" /></label>
        <label className="grid gap-1"><span className="font-semibold">Hours (optional)</span><textarea value={f.hours} onChange={set("hours")} className="field min-h-[4rem] w-full font-[inherit]" placeholder={"Mon to Fri 9 to 6\nSat 10 to 4"} /></label>
        <label className="grid gap-1"><span className="font-semibold">Questions and answers</span><span className="text-[0.85rem] text-ink-3">Q: on one line, A: on the next, a blank line between each.</span><textarea value={f.faq} onChange={set("faq")} className={`${area} min-h-[10rem]`} /></label>
      </div>
      {left.length ? <p className="mt-3 rounded-xl bg-warn-bg p-3 text-[0.95rem] text-warn">Still to fill in: {left.join(", ")}.</p> : null}
      {msg ? <p className={`mt-3 rounded-xl p-3 text-[0.95rem] ${msg.ok ? "bg-good-bg text-good" : "bg-warn-bg text-warn"}`} aria-live="polite">{msg.text}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={publish} disabled={busy || left.length > 0} className="btn btn-primary !min-h-[44px] disabled:opacity-50">
          {busy ? "Saving…" : live ? "Update my page" : "Publish my page"}
        </button>
        {live ? <button type="button" onClick={takeDown} disabled={busy} className="text-ink-3 underline underline-offset-4">Take it down</button> : null}
      </div>
    </details>
  );
}
