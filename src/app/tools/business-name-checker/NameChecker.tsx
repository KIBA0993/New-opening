"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { checkBusinessName, type Level } from "@/lib/nameCheck";

const RISK: Record<string, { label: string; cls: string; note: string }> = {
  high: { label: "High risk", cls: "bg-bad-bg text-bad", note: "This name breaks Google's name rules. New profiles with names like this are often suspended." },
  medium: { label: "Some risk", cls: "bg-warn-bg text-warn", note: "Google may question parts of this name. Fine only if it matches your sign and license exactly." },
  low: { label: "Low risk", cls: "bg-good-bg text-good", note: "Small things to tidy, nothing that usually triggers a suspension." },
  none: { label: "Looks fine", cls: "bg-good-bg text-good", note: "Nothing in this name breaks Google's rules. Keep it identical on every listing." },
};
const DOT: Record<Level, string> = { high: "bg-bad", medium: "bg-warn", low: "bg-ink-3" };

export function NameChecker() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [onSignage, setOnSignage] = useState(false);
  const result = useMemo(() => checkBusinessName(name, { city, onSignage }), [name, city, onSignage]);
  const r = RISK[result.risk];

  return (
    <div className="card p-5 sm:p-6">
      <label className="block font-semibold" htmlFor="bn-name">Business name, as you'd enter it on Google</label>
      <input id="bn-name" className="field mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bright Day Cleaning - Affordable House Cleaning Austin" maxLength={120} autoComplete="off" />
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="block font-semibold" htmlFor="bn-city">Your city or neighborhood <span className="font-normal text-ink-3">(optional)</span></label>
          <input id="bn-city" className="field mt-2 w-full" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin" maxLength={60} autoComplete="off" />
        </div>
        <label className="flex items-center gap-2 pb-3 text-ink-2">
          <input type="checkbox" checked={onSignage} onChange={(e) => setOnSignage(e.target.checked)} />
          This exact name is on my sign and license
        </label>
      </div>

      {name.trim() ? (
        <div className="mt-6" aria-live="polite">
          <p className={`inline-block rounded-full px-3 py-1 text-[0.9rem] font-semibold ${r.cls}`}>{r.label}</p>
          <p className="mt-2 text-ink-2">{r.note}</p>
          {result.issues.length ? (
            <ul className="mt-4 space-y-3">
              {result.issues.map((i) => (
                <li key={i.title} className="flex gap-3">
                  <span aria-hidden className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[i.level]}`} />
                  <div>
                    <p className="font-semibold">{i.title}{i.match ? <span className="font-normal text-ink-3"> · “{i.match}”</span> : null}</p>
                    <p className="text-ink-2">{i.why}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {result.suggestion ? (
            <div className="mt-5 rounded-xl bg-paper-2 p-4">
              <p className="text-[0.9rem] text-ink-3">A safer starting point (use your real-world name if it differs):</p>
              <p className="font-display mt-1 text-[1.3rem]">{result.suggestion}</p>
            </div>
          ) : null}
          <p className="mt-5 text-[0.95rem] text-ink-2">
            Next: <Link href="/start" className="link">run the free check</Link> to see whether Google and AI assistants already show your business.
          </p>
        </div>
      ) : null}
    </div>
  );
}
