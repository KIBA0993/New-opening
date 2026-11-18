import "server-only";
import { env } from "./env";

/**
 * Cron routes send customer emails and run paid AI calls, so they only run for Vercel's scheduler,
 * which sends "Authorization: Bearer <CRON_SECRET>". With no secret set they refuse in production
 * (local dev stays open for testing).
 */
export function cronAllowed(req: Request) {
  if (!env.cronSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[cron] CRON_SECRET is not set, so scheduled jobs are refused. Add it in Vercel > Settings > Environment Variables.");
      return false;
    }
    return true;
  }
  return req.headers.get("authorization") === `Bearer ${env.cronSecret}`;
}

/** The Monday (UTC) of this week, e.g. "2026-11-16": marks which week's email a subscriber already got. */
export function weekKey(now = new Date()) {
  return new Date(now.getTime() - ((now.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
}
