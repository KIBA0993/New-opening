"use client";
import Link from "next/link";
import { useEffect } from "react";

// Last-resort fallback for the free check: the site header and a way forward stay on screen.
export default function ReportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("report page failed", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="eyebrow">Free check</p>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight">Your check hit a snag</h1>
      <p className="mt-2 text-ink-2">Something went wrong on our side while checking this business. Please try again in a minute.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-accent">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Back to the start
        </Link>
      </div>
    </div>
  );
}
