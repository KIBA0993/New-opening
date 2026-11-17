"use client";
import { useState } from "react";

export function SignInForm({ next, google }: { next: string; google: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [sampleLink, setSampleLink] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSentTo(email);
      setSampleLink(data.sampleLink || "");
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  if (sentTo) {
    return (
      <div role="status" className="card p-5">
        <p className="font-display text-[1.4rem]">Check your email</p>
        <p className="mt-2 text-ink-2">We sent a sign-in link to <b>{sentTo}</b>. Tap it on this phone or computer. It works for 15 minutes.</p>
        {sampleLink ? (
          <p className="mt-4 text-[0.92rem] text-ink-3">
            Sample mode, no email service yet: <a href={sampleLink} className="font-semibold text-accent underline">open your sign-in link</a>
          </p>
        ) : null}
        <button type="button" className="mt-4 text-[0.95rem] underline underline-offset-4" onClick={() => setSentTo("")}>Use a different email</button>
      </div>
    );
  }

  return (
    <div>
      {google ? (
        <>
          <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="btn btn-ghost w-full gap-3 !min-h-[52px]">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Continue with Google
          </a>
          <p className="my-5 text-center text-[0.9rem] text-ink-3">or</p>
        </>
      ) : null}
      <form onSubmit={submit}>
        <label htmlFor="email" className="font-semibold">Email</label>
        <input id="email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbusiness.com" className="field mt-2" />
        <button type="submit" disabled={busy} className="btn btn-primary mt-4 w-full !min-h-[52px]">{busy ? "Sending…" : "Email me a sign-in link"}</button>
        {error ? <p role="alert" className="mt-3 text-bad">{error}</p> : null}
      </form>
      <p className="mt-4 text-[0.9rem] text-ink-3">Use the email you paid with. No password needed.</p>
    </div>
  );
}
