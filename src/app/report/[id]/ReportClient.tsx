"use client";
import { track } from "@/lib/track";
import { Children, useEffect, useState } from "react";
import { Honeypot } from "@/components/Turnstile";
import { BuyButton } from "@/components/BuyButton";
import { useCountdown } from "@/components/DealBanner";

/**
 * Buy bar pinned to the bottom of the screen (phone and desktop). Shows once the offer at the
 * top has scrolled away, hides when the full offer at the end is on screen.
 */
export function StickyBuyBar({ placeId, industry, kitLabel, endsAt }: { placeId: string; industry: string; kitLabel: string; endsAt: number | null }) {
  const [show, setShow] = useState(false);
  const { text } = useCountdown(endsAt ?? 0);
  useEffect(() => {
    const onScroll = () => {
      const top = document.getElementById("offer");
      const offer = document.getElementById("unlock");
      const pastTop = top ? top.getBoundingClientRect().bottom < 0 : window.scrollY > 500;
      const atOffer = offer ? offer.getBoundingClientRect().top < window.innerHeight : false;
      setShow(pastTop && !atOffer);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div aria-hidden={!show} inert={!show} className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur transition-transform ${show ? "translate-y-0" : "translate-y-full"}`}>
      <div className="mx-auto flex max-w-3xl items-center gap-3 sm:gap-5">
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="font-semibold leading-tight">Launch Kit · {kitLabel} one time</p>
          <p className="text-[0.88rem] text-ink-3">
            Fixes everything this check found.{endsAt && text ? <> Launch deal ends in <span className="font-semibold tabular-nums text-accent">{text}</span>.</> : null}
          </p>
        </div>
        <div className="w-full sm:w-auto" onClick={() => track("sticky_bar")}>
          <BuyButton product="kit" placeId={placeId} industry={industry} className="btn btn-accent w-full !min-h-[52px] sm:!px-7">
            Get my Launch Kit · {kitLabel}
          </BuyButton>
          {endsAt && text ? <p className="mt-1 text-center text-[0.8rem] text-ink-3 sm:hidden">Launch deal ends in <span className="font-semibold tabular-nums text-accent">{text}</span></p> : null}
        </div>
      </div>
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
