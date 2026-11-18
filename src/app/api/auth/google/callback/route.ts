import { NextResponse } from "next/server";
import { googleFinish, safeNext, startSession } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const code = sp.get("code");
  const state = sp.get("state");
  if (!code || !state) return NextResponse.redirect(`${env.siteUrl}/signin?error=google`);
  try {
    const out = await googleFinish(code, state);
    if (!out) return NextResponse.redirect(`${env.siteUrl}/signin?error=google`);
    await startSession(out.email);
    return NextResponse.redirect(env.siteUrl + safeNext(out.next));
  } catch (e) {
    console.error("google callback", e);
    return NextResponse.redirect(`${env.siteUrl}/signin?error=google`);
  }
}
