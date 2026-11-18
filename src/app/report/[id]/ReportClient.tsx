"use client";
import { track } from "@vercel/analytics";
import { Children, useEffect, useState } from "react";
import { Honeypot } from "@/components/Turnstile";

/** Phone-only bar that appears once the score has scrolled away, and hides at the offer itself. */
export function StickyKitBar({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("vis");
    const offer = document.getElementById("unlock");
    const onScroll = () => {
      const pastHero = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 600;
      const atOffer = offer ? offer.getBoundingClientRect().top < window.innerHeight : false;
      setShow(pastHero && !atOffer);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div aria-hidden={!show} className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur transition-transform sm:hidden ${show ? "translate-y-0" : "translate-y-full"}`}>
      <a href="#fixes" tabIndex={show ? 0 : -1} onClick={() => track("sticky_bar")} className="btn btn-accent w-full !min-h-[52px]">
        {label} →
      </a>
    </div>
  );
}

/** On phones, shows the first few rows and a "See all" button. Desktop shows everything. */
export function ShowFew({ children, few = 2, label }: { children: React.ReactNode; few?: number; label: string }) {
  const [all, setAll] = useState(false);
  const items = Children.toArray(children);
  return (
    <>
      <ul className="mt-5 space-y-3">
        {items.map((c, i) => (
          <li key={i} className={i >= few && !all ? "max-sm:hidden" : undefined}>{c}</li>
        ))}
      </ul>
      {!all && items.length > few ? (
        <div className="mt-3 sm:hidden">
          <button type="button" className="btn btn-ghost w-full" onClick={() => setAll(true)}>
            {label}
          </button>
        </div>
      ) : null}
    </>
  );
}

/** "Email me this report": sends the link to this check, no sign-up. */
export function EmailReport({ name, reportPath }: { name: string; reportPath: string }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/report-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, reportPath, company_site: hp }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : "error");
    if (res?.ok) track("email_report");
  }
  if (state === "sent") return <p role="status" className="font-semibold text-good">Sent. Check {email} for the link to this report.</p>;
  return (
    <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="report-email" className="sr-only">Your email</label>
      <input id="report-email" type="email" required autoComplete="email" inputMode="email" placeholder="you@yourbusiness.com" className="field sm:flex-1" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Honeypot value={hp} onChange={setHp} />
      <button type="submit" className="btn btn-ghost" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Email me this report"}</button>
      {state === "error" ? <p role="alert" className="text-bad sm:basis-full">That didn&apos;t send. Please check the address and try again.</p> : null}
    </form>
  );
}
