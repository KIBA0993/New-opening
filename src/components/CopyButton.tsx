"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className={`btn ${done ? "bg-good text-white" : "btn-primary"} !min-h-[44px] !px-4 text-[0.95rem] ${className}`}>
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}

/** Copies formatted text (headings, lists) for site builders like Wix and Squarespace, with plain text as a fallback. */
export function RichCopyButton({ html, text, label = "Copy formatted" }: { html: string; text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
    } catch {
      await navigator.clipboard.writeText(text).catch(() => undefined);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className={`btn ${done ? "bg-good text-white" : "btn-ghost"} !min-h-[44px] !px-4 text-[0.95rem]`}>
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}

/** "640 of 750 characters", in warning colors when over the platform's limit. */
export function CharCount({ text, limit }: { text: string; limit: number }) {
  const n = [...text].length;
  return <span className={n > limit ? "font-semibold text-warn" : ""}>{n} of {limit} characters{n > limit ? `. Trim ${n - limit} before pasting` : ""}</span>;
}

/** A labeled piece of AI-written text with a big copy button. */
export function CopyBlock({ label, text, hint, limit }: { label: string; text: string; hint?: string; limit?: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{label}</p>
          {hint ? <p className="text-[0.85rem] text-ink-3">{hint}</p> : null}
          {limit ? <p className="text-[0.85rem] text-ink-3"><CharCount text={text} limit={limit} /></p> : null}
        </div>
        <CopyButton text={text} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]">{text}</p>
    </div>
  );
}
