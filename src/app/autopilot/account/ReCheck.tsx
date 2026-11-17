"use client";
import { useState } from "react";

interface Result {
  pct: number;
  byEngine: { engine: string; label: string; named: number; total: number }[];
  answers: { engine: string; prompt: string; mentionsYou: boolean; rivalsMentioned: string[] }[];
  left: number;
  demo: boolean;
}

/** Run-a-fresh-check button with a live credit counter, plus the top-up button. */
export function ReCheck({ sessionId, initialLeft, topupLabel }: { sessionId: string; initialLeft: number; topupLabel: string }) {
  const [left, setLeft] = useState(initialLeft);
  const [busy, setBusy] = useState<"" | "check" | "topup">("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function post(path: string) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId }) });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong."), { left: data.left });
    return data;
  }

  async function check() {
    setBusy("check");
    setError("");
    try {
      const data = (await post("/api/recheck")) as Result;
      setResult(data);
      setLeft(data.left);
    } catch (e) {
      setError((e as Error).message);
      if ((e as { left?: number }).left === 0) setLeft(0);
    }
    setBusy("");
  }

  async function topup() {
    setBusy("topup");
    setError("");
    try {
      const { url } = await post("/api/topup");
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }

  return (
    <div>
      <p className="text-[1.05rem]" aria-live="polite">
        <span className="font-display text-[2.6rem] leading-none">{left}</span> <span className="text-ink-2">re-checks left</span>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn btn-accent" onClick={check} disabled={!!busy || left <= 0}>
          {busy === "check" ? "Asking AI assistants… about 20 seconds" : "Run a fresh check now"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={topup} disabled={!!busy}>
          {busy === "topup" ? "Opening secure checkout…" : topupLabel}
        </button>
      </div>
      {error ? <p role="alert" className="mt-3 text-bad">{error}</p> : null}
      {result ? (
        <div className="card mt-6 p-5" aria-live="polite">
          <p className="eyebrow">Fresh check{result.demo ? " · sample data" : ""}</p>
          <p className="font-display mt-1 text-[3rem] leading-none">{result.pct}%</p>
          <p className="mt-1 text-ink-2">of AI answers named you just now.</p>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {result.answers.map((a, i) => (
              <li key={i} className="py-3">
                <p className="font-semibold">{a.mentionsYou ? "Named you" : "Didn't name you"} · <span className="font-normal text-ink-3">{a.engine}</span></p>
                <p className="text-[0.95rem] text-ink-2">&ldquo;{a.prompt}&rdquo;</p>
                {a.rivalsMentioned.length ? <p className="text-[0.9rem] text-ink-3">Named instead: {a.rivalsMentioned.join(", ")}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
