import { NextResponse } from "next/server";
import { readMagicLink, safeNext, startSession } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") || undefined;
  let link = null;
  try {
    link = readMagicLink(t);
  } catch {
    link = null;
  }
  if (!link) return NextResponse.redirect(`${env.siteUrl}/signin?error=expired`);
  await startSession(link.email);
  return NextResponse.redirect(env.siteUrl + safeNext(link.next));
}
