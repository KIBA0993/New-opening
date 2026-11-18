import "server-only";
import { cookies } from "next/headers";
import { isAdmin } from "./admin";
import { decodeSource, nameSource, SOURCE_COOKIE, type Named } from "./sources";

/** Set at admin sign-in so the owner's own browsing never counts, even after the admin session ends. */
export const OWNER_COOKIE = "md_me";

/** True for the owner's browsers, local runs and Vercel preview deploys: none of these are real visitors. */
export async function notCounted() {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return true;
  if ((await cookies()).get(OWNER_COOKIE)?.value === "1") return true;
  return isAdmin();
}

/** The first outside source this browser came from (Direct when we don't know). */
export async function visitorSource(): Promise<Named> {
  return nameSource(decodeSource((await cookies()).get(SOURCE_COOKIE)?.value));
}
