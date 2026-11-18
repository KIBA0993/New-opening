import { NextResponse } from "next/server";
import { z } from "zod";
import { renderReportEmail, saveLead, sendEmail } from "@/lib/email";
import { reportEmailTarget } from "@/lib/reportLink";
import { allow, allowIp, markHuman, trippedHoneypot, verifyTurnstile } from "@/lib/guard";

const Body = z.object({
  email: z.string().email().max(200),
  name: z.string().max(200),
  reportPath: z.string().startsWith("/report/").max(600),
  token: z.string().max(4000).optional(),
});

// Saves the owner's email, sends them a link to their free check, and passes the bot check
// so the check itself can run.
export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (trippedHoneypot(raw)) return NextResponse.json({ ok: true }); // pretend it worked
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { email, reportPath, token } = parsed.data;
  if (!(await verifyTurnstile(token))) {
    return NextResponse.json({ ok: false, error: "We couldn't confirm you're a person. Please try again." }, { status: 403 });
  }
  await markHuman();
  if (!(await allowIp("lead", 10, 3600))) return NextResponse.json({ ok: true });
  // Never email the same address more than a few times a day, whoever asks.
  // The link and business name are rebuilt on our side, never taken as typed.
  const target = await reportEmailTarget(reportPath);
  if (!target) return NextResponse.json({ ok: false }, { status: 400 });
  if (await allow("lead-email", email.toLowerCase(), 3, 86400)) {
    await saveLead(email, target.name);
    await sendEmail(email, `Your free check for ${target.name}`, renderReportEmail(target.name, target.url, "Here's where you show up on Google, Maps and AI, and what to fix first."));
  }
  return NextResponse.json({ ok: true });
}
