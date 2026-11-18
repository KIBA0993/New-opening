import "server-only";
import { unstable_cache } from "next/cache";
import { env, has } from "../env";

// Is DataForSEO worth calling right now? Its keys can be set while the prepaid balance is empty,
// and then every call fails. One free balance lookup (appendix/user_data), kept an hour, decides.
// DATAFORSEO_ENABLED=0 turns it off by hand without removing the keys.

const MIN_BALANCE = Number(process.env.DATAFORSEO_MIN_BALANCE || 0.5); // dollars

const readBalance = unstable_cache(
  async (): Promise<number | null> => {
    const res = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
      headers: { Authorization: "Basic " + Buffer.from(`${env.dataforseoLogin}:${env.dataforseoPassword}`).toString("base64") },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { tasks?: { result?: { money?: { balance?: number } }[] }[] };
    const bal = data.tasks?.[0]?.result?.[0]?.money?.balance;
    return typeof bal === "number" ? bal : null;
  },
  ["dfs-balance-v1"],
  { revalidate: 60 * 60 },
);

/** True when DataForSEO keys are set, it isn't switched off, and the account has money on it. */
export async function dataforseoReady(): Promise<boolean> {
  if (!has.dataforseo() || process.env.DATAFORSEO_ENABLED === "0") return false;
  try {
    const bal = await readBalance();
    return bal == null ? true : bal >= MIN_BALANCE; // can't read the balance: let calls try and fail softly
  } catch {
    return true;
  }
}
