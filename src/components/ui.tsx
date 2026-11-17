import type { ReactNode } from "react";

export type Light = "green" | "yellow" | "red" | "gray";

const LIGHT: Record<Light, { dot: string; bg: string; text: string; label: string }> = {
  green: { dot: "bg-good", bg: "bg-good-bg", text: "text-good", label: "Good" },
  yellow: { dot: "bg-[#c98a00]", bg: "bg-warn-bg", text: "text-warn", label: "Needs work" },
  red: { dot: "bg-bad", bg: "bg-bad-bg", text: "text-bad", label: "Fix this" },
  gray: { dot: "bg-ink-3", bg: "bg-paper-3", text: "text-ink-2", label: "Check yourself" },
};

export function Pill({ light, children }: { light: Light; children?: ReactNode }) {
  const l = LIGHT[light];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8rem] font-semibold ${l.bg} ${l.text}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${l.dot}`} />
      {children ?? l.label}
    </span>
  );
}

export function DemoTag({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span
      title="Some results on this page are sample data because a service isn't connected yet."
      className="inline-flex items-center rounded-full border border-dashed border-ink-3 px-2 py-0.5 text-[0.75rem] font-semibold text-ink-3"
    >
      Sample data
    </span>
  );
}

export function Section({ id, eyebrow, title, children, className = "" }: { id?: string; eyebrow?: string; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-5xl px-4 sm:px-6 ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="font-display mt-2 text-[2rem] leading-tight sm:text-[2.6rem]">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`h-5 w-5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}
