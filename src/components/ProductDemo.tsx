"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import { Check, Pill } from "./ui";

// A short, looping product walkthrough built from sample data (no video file, no API spend).
// Four scenes, about 4.5 seconds each. Pauses on hover/focus, and never autoplays for
// visitors who ask for reduced motion.

const SCENE_MS = 4500;
const BIZ = "Bright Day Cleaning";
const TYPED = "Bright Day Cleaning, Austin";

const SCENES = [
  { key: "search", label: "Type your business" },
  { key: "score", label: "See your score" },
  { key: "rivals", label: "See who's named instead" },
  { key: "kit", label: "Get every profile written" },
] as const;

function useTicker(active: boolean, ms: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    setT(0);
    const id = setInterval(() => setT(Math.min(1, (Date.now() - start) / ms)), 60);
    return () => clearInterval(id);
  }, [active, ms]);
  return active ? t : 1;
}

export function ProductDemo() {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const playing = !paused && !reduced;
  const t = useTicker(playing, SCENE_MS * 0.8);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setScene((s) => (s + 1) % SCENES.length), SCENE_MS);
    return () => clearTimeout(id);
  }, [scene, playing]);

  const pick = (i: number) => {
    setScene(i);
    setPaused(true);
    if (!seen) {
      setSeen(true);
      track("demo_step_click", { step: SCENES[i].key });
    }
  };

  return (
    <figure
      className="card overflow-hidden shadow-[0_18px_40px_-24px_rgba(28,26,22,0.45)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 border-b border-line bg-paper-3 px-4 py-2.5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#d9cfbd]" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#d9cfbd]" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#d9cfbd]" />
        <span className="ml-2 truncate rounded-md bg-paper-2 px-3 py-0.5 text-[0.8rem] text-ink-3">mapdebut.com</span>
        <span className="ml-auto text-[0.75rem] font-semibold text-ink-3">{paused || reduced ? "Paused" : "Playing"}</span>
      </div>

      <div className="relative min-h-[300px] p-5 sm:min-h-[280px] sm:p-6" aria-live="polite">
        {scene === 0 ? <SearchScene t={t} /> : null}
        {scene === 1 ? <ScoreScene t={t} /> : null}
        {scene === 2 ? <RivalScene t={t} /> : null}
        {scene === 3 ? <KitScene t={t} /> : null}
      </div>

      <div className="border-t border-line px-3 py-3 sm:px-4">
        <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {SCENES.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-current={i === scene ? "step" : undefined}
                className={`relative w-full overflow-hidden rounded-lg px-2 py-2 text-left text-[0.82rem] font-semibold leading-tight ${i === scene ? "bg-ink text-paper" : "bg-paper-3 text-ink-2 hover:bg-line"}`}
              >
                <span className="mr-1 opacity-70">{i + 1}.</span>
                {s.label}
                {i === scene && playing ? (
                  <span aria-hidden className="absolute bottom-0 left-0 h-[3px] bg-accent" style={{ width: `${Math.round(t * 100)}%` }} />
                ) : null}
              </button>
            </li>
          ))}
        </ol>
        <figcaption className="mt-2 text-[0.8rem] text-ink-3">Demo with sample data. Your free check runs real questions with live web search.</figcaption>
      </div>
    </figure>
  );
}

function SearchScene({ t }: { t: number }) {
  const typed = TYPED.slice(0, Math.round(Math.min(1, t * 1.6) * TYPED.length));
  const done = t > 0.7;
  return (
    <div>
      <p className="eyebrow !text-ink-3">Free check</p>
      <p className="font-display mt-1 text-[1.4rem] leading-snug">What's your business called?</p>
      <div className="field mt-4 flex items-center bg-white">
        <span>{typed}</span>
        <span aria-hidden className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-ink" />
      </div>
      {done ? (
        <div className="mt-2 rounded-xl border border-line bg-white p-3">
          <p className="font-semibold">{BIZ}</p>
          <p className="text-[0.88rem] text-ink-3">House cleaning · East Austin, TX · opened 3 weeks ago</p>
        </div>
      ) : null}
      <p className="mt-4 text-[0.9rem] text-ink-3">Free. About a minute. No card needed.</p>
    </div>
  );
}

const BARS = [
  { name: "ChatGPT", v: 18 },
  { name: "Google AI", v: 52 },
  { name: "Gemini + Perplexity", v: 31 },
];

function ScoreScene({ t }: { t: number }) {
  const k = Math.min(1, t * 1.4);
  const score = Math.round(34 * k);
  return (
    <div>
      <p className="eyebrow !text-ink-3">{BIZ}</p>
      <div className="mt-1 flex items-end gap-3">
        <p className="font-display text-[3rem] leading-none tabular-nums">{score}</p>
        <p className="pb-1 text-ink-3">/ 100 · how easy you are to find</p>
      </div>
      <ul className="mt-5 space-y-3">
        {BARS.map((b) => (
          <li key={b.name}>
            <div className="flex justify-between text-[0.9rem]">
              <span className="font-semibold">{b.name}</span>
              <span className="tabular-nums text-ink-3">{Math.round(b.v * k)}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper-3">
              <div className={`h-full rounded-full ${b.v < 30 ? "bg-bad" : b.v < 50 ? "bg-[#c98a00]" : "bg-good"}`} style={{ width: `${b.v * k}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {t > 0.75 ? <p className="mt-4 text-[0.9rem] font-semibold text-accent-ink">Top fix: you're missing from Yelp, which ChatGPT reads first.</p> : null}
    </div>
  );
}

const RIVALS = ["Sparkle & Shine Cleaning", "Lone Star Maids", "TidyNest Co."];

function RivalScene({ t }: { t: number }) {
  const shown = Math.min(RIVALS.length + 1, Math.floor(t * 5.5));
  return (
    <div>
      <p className="eyebrow !text-ink-3">Asked AI assistants</p>
      <p className="font-display mt-1 text-[1.3rem] leading-snug">“best house cleaner in East Austin”</p>
      <ol className="mt-4 space-y-2">
        {RIVALS.slice(0, shown).map((r, i) => (
          <li key={r} className="flex items-center justify-between gap-3 border-b border-dashed border-line pb-2">
            <span><span className="mr-2 text-ink-3">{i + 1}.</span>{r}</span>
            <Pill light="green">Named</Pill>
          </li>
        ))}
        {shown > RIVALS.length ? (
          <li className="flex items-center justify-between gap-3 pt-1">
            <span className="font-semibold">{BIZ}</span>
            <Pill light="red">Not named</Pill>
          </li>
        ) : null}
      </ol>
      {shown > RIVALS.length ? <p className="mt-3 text-[0.9rem] text-ink-3">Named in 0 of 3 assistants. Rivals are listed on Yelp, Angi and Thumbtack.</p> : null}
    </div>
  );
}

const DESC = `${BIZ} is a locally owned house cleaning service in East Austin. We offer weekly, deep and move-out cleans with eco-friendly products, and same-week booking.`;
const FIELDS = ["Google business description", "Categories and services", "Yelp specialties", "Review link and QR card"];

function KitScene({ t }: { t: number }) {
  const written = DESC.slice(0, Math.round(Math.min(1, t * 1.5) * DESC.length));
  const done = Math.min(FIELDS.length, Math.floor(t * 5));
  return (
    <div>
      <p className="eyebrow !text-ink-3">Launch Kit</p>
      <div className="mt-2 rounded-xl border border-line bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[0.82rem] font-semibold text-ink-3">Google business description</p>
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.75rem] font-semibold">Copy</span>
        </div>
        <p className="mt-1 min-h-[4.5em] text-[0.92rem] leading-snug">{written}</p>
      </div>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {FIELDS.map((f, i) => (
          <li key={f} className={`flex items-center gap-2 text-[0.9rem] ${i < done ? "text-ink" : "text-ink-3"}`}>
            <Check className={i < done ? "text-good" : "text-line"} />
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.9rem] text-ink-3">Written for 6 platforms. Paste, verify, done in an afternoon.</p>
    </div>
  );
}
