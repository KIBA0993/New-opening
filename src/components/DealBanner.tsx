"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Ticking "28d 10:17:31" until a fixed deadline, or null before mount / after it passes. */
export function useCountdown(endsAt: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now == null) return { text: null, over: false };
  return { text: now < endsAt ? left(endsAt - now) : null, over: now >= endsAt };
}

function left(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  return `${d}d ${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/**
 * Site-wide launch deal bar. The deadline is fixed (it never resets per visitor),
 * and the bar disappears once it passes.
 */
export function DealBanner({ endsAt, endLabel, after }: { endsAt: number; endLabel: string; after: string }) {
  const { text, over } = useCountdown(endsAt);
  if (over) return null;
  return (
    <div className="bg-ink text-paper">
      <p className="mx-auto max-w-5xl px-4 py-2 text-center text-[0.88rem] leading-snug sm:px-6 sm:text-[0.92rem]">
        <span className="font-semibold">Launch deal ends in </span>
        <span className="font-semibold tabular-nums text-[#f0a37f]" aria-live="off">
          {text ?? endLabel}
        </span>
        <span className="text-[#d9d1c3]"> · after {endLabel}, {after}. Buy now and keep today&apos;s price. </span>
        <Link href="/#pricing" className="whitespace-nowrap font-semibold underline underline-offset-4">See pricing</Link>
      </p>
    </div>
  );
}
