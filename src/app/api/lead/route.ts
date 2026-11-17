import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { renderReportEmail, saveLead, sendEmail } from "@/lib/email";

const Body = z.object({
  email: z.string().email().max(200),
  name: z.string().max(200),
  reportPath: z.string().startsWith("/report/").max(600),
});

// Saves the owner's email and sends them a link to their free check.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { email, name, reportPath } = parsed.data;
  await saveLead(email, name);
  await sendEmail(email, `Your free check for ${name}`, renderReportEmail(name, env.siteUrl + reportPath, "Here's where you show up on Google, Maps and AI, and what to fix first."));
  return NextResponse.json({ ok: true });
}
