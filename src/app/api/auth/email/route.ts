import { NextResponse } from "next/server";
import { z } from "zod";
import { magicLink, safeNext } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { has } from "@/lib/env";
import { allow, allowIp, trippedHoneypot, verifyTurnstile } from "@/lib/guard";

const Body = z.object({ email: z.string().email().max(200), next: z.string().max(500).optional(), token: z.string().max(4000).optional() });

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (trippedHoneypot(raw)) return NextResponse.json({ ok: true }); // pretend it worked
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!(await verifyTurnstile(parsed.data.token))) return NextResponse.json({ error: "We couldn't confirm you're a person. Please try again." }, { status: 403 });
  if (!(await allowIp("signin", 5, 600))) return NextResponse.json({ error: "Too many sign-in emails. Please wait a few minutes." }, { status: 429 });
  // Cap per address too, so nobody can flood someone else's inbox.
  if (!(await allow("signin-email", parsed.data.email.toLowerCase(), 3, 3600))) {
    return NextResponse.json({ error: "We've sent several links to this email already. Please check your inbox, or wait an hour." }, { status: 429 });
  }

  let link: string;
  try {
    link = magicLink(parsed.data.email, safeNext(parsed.data.next));
  } catch (e) {
    console.error("auth", e);
    return NextResponse.json({ error: "Sign-in isn't set up yet." }, { status: 503 });
  }
  await sendEmail(
    parsed.data.email,
    "Your Opening Day sign-in link",
    `<p style="font:16px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif">Tap to sign in. The link works for 15 minutes.</p>
<p><a href="${link}" style="display:inline-block;background:#1C1A16;color:#F4EFE6;padding:12px 18px;border-radius:999px;text-decoration:none;font:600 16px -apple-system,Segoe UI,Helvetica,Arial,sans-serif">Sign in to Opening Day</a></p>
<p style="font:13px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#6B6459">If you didn't ask for this, you can ignore it.</p>`,
  );
  // Sample mode only (no email service and no payments): show the link so the flow can be tried.
  const sample = !has.resend() && !has.stripe();
  return NextResponse.json({ ok: true, ...(sample ? { sampleLink: link } : {}) });
}
