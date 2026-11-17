import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentEmail, googleEnabled, safeNext } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in", alternates: { canonical: "/signin" }, robots: { index: false } };

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already replaced. Send a new one below.",
  google: "Google sign-in didn't finish. Please try again, or use your email.",
  "google-off": "Google sign-in isn't turned on yet. Use your email for now.",
};

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await currentEmail()) redirect(next);
  return (
    <div className="mx-auto max-w-md px-4 pt-12 sm:pt-16">
      <p className="eyebrow">Your account</p>
      <h1 className="font-display mt-2 text-[2.3rem] leading-tight">Sign in</h1>
      <p className="mt-2 text-ink-2">See your Launch Kit, your Autopilot and your re-checks in one place.</p>
      {sp.error && ERRORS[sp.error] ? <p role="alert" className="card mt-6 p-4 text-bad">{ERRORS[sp.error]}</p> : null}
      <div className="mt-8">
        <SignInForm next={next} google={googleEnabled()} />
      </div>
    </div>
  );
}
