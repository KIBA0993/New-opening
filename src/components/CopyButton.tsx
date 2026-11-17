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

/** A labeled piece of AI-written text with a big copy button. */
export function CopyBlock({ label, text, hint }: { label: string; text: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{label}</p>
          {hint ? <p className="text-[0.85rem] text-ink-3">{hint}</p> : null}
        </div>
        <CopyButton text={text} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]">{text}</p>
    </div>
  );
}
