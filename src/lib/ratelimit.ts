import "server-only";
import { env } from "./env";
import { allow, clientIp } from "./guard";
import { isOwnerBrowser } from "./admin";

export { clientIp };

/** Daily cap on free checks per visitor. Re-opening the same check doesn't count again. */
export async function allowCheck(key: string): Promise<boolean> {
  // The owner testing links from a signed-in browser never uses up the shared daily cap.
  if (await isOwnerBrowser()) return true;
  const ip = await clientIp();
  const day = new Date().toISOString().slice(0, 10);
  // Seeing the same check twice is free: remember it for the day.
  if (!(await allow("check-seen", `${ip}|${key}|${day}`, 1, 86400))) return true;
  return allow("checks", ip, env.freeChecksPerDay, 86400);
}
