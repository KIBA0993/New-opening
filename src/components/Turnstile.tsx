"use client";
import { useEffect, useRef } from "react";

// Cloudflare Turnstile: an invisible "are you human" check. It only shows a box
// when Cloudflare isn't sure. Renders nothing when no site key is set.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<void> | null = null;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("turnstile load failed"));
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Calls onToken with a fresh token (or "" when it expires). Change resetKey to get a new token after one is used. */
export function Turnstile({ onToken, onError, resetKey = 0 }: { onToken: (t: string) => void; onError?: () => void; resetKey?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const id = useRef<string | undefined>(undefined);
  const cb = useRef(onToken);
  cb.current = onToken;
  const err = useRef(onError);
  err.current = onError;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let gone = false;
    loadScript()
      .then(() => {
        if (gone || !el.current || !window.turnstile) return;
        id.current = window.turnstile.render(el.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          size: "flexible",
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(""),
          "error-callback": () => {
            cb.current("");
            err.current?.();
          },
        });
      })
      .catch(() => {
        cb.current("");
        err.current?.();
      });
    return () => {
      gone = true;
      if (id.current) window.turnstile?.remove(id.current);
    };
  }, []);

  useEffect(() => {
    if (resetKey && id.current) {
      cb.current("");
      window.turnstile?.reset(id.current);
    }
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={el} className="mt-3" />;
}

export const TURNSTILE_FAILED = "Our bot check didn't load. Turn off ad blockers or private relay for this site, or try another browser.";

/** Hidden field people never see or fill. Bots that fill every input give themselves away. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
      <label htmlFor="company_site">Leave this empty</label>
      <input id="company_site" name="company_site" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
