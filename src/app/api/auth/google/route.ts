import { NextResponse } from "next/server";
import { googleEnabled, googleStart } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  if (!googleEnabled()) return NextResponse.redirect(`${env.siteUrl}/signin?error=google-off`);
  const next = new URL(req.url).searchParams.get("next") || "/me";
  try {
    return NextResponse.redirect(await googleStart(next));
  } catch (e) {
    console.error("google start", e);
    return NextResponse.redirect(`${env.siteUrl}/signin?error=google`);
  }
}
