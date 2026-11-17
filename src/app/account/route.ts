import { NextResponse } from "next/server";

// Stripe's no-code customer portal: owners sign in with their email to update or cancel.
export function GET() {
  const url = process.env.STRIPE_PORTAL_LOGIN_URL;
  return NextResponse.redirect(url || new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
