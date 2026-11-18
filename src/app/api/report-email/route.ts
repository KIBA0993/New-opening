import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { renderReportEmail, saveLead, sendEmail } from "@/lib/email";
import { allow, allowIp, isHuman, trippedHoneypot } from "@/lib/guard";

const Body = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().max(200),
  reportPath: z.string().startsWith("/report/").max(600),
});

// "Email me this report" on the results page. The visitor already passed the bot check to see it.
export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (trippedHoneypot(raw)) return NextResponse.json({ ok: true });
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  if (!(await isHuman())) return NextResponse.json({ ok: false }, { status: 403 });
  if (!(await allowIp("report-email", 5, 3600))) return NextResponse.json({ ok: false }, { status: 429 });
  const { email, name, reportPath } = parsed.data;
  if (await allow("lead-email", email.toLowerCase(), 3, 86400)) {
    await saveLead(email, name);
    await sendEmail(email, `Your free check for ${name}`, renderReportEmail(name, env.siteUrl + reportPath, "Here's where you show up on Google, Maps and AI, and what to fix first."));
  }
  return NextResponse.json({ ok: true });
}
