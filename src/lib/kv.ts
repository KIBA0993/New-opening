import "server-only";
import { env } from "./env";

// Small JSON store for things that must outlive a deploy (Kit progress). Upstash Redis when it's
// set up; otherwise one server's memory, which resets on each deploy (the Kit page then also keeps
// a copy in the browser).

const mem = new Map<string, string>();
const on = () => !!(env.upstashUrl && env.upstashToken);

async function call(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(env.upstashUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.upstashToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd.map(String)),
    cache: "no-store",
  });
  return ((await res.json()) as { result?: unknown }).result ?? null;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = on() ? ((await call(["GET", key])) as string | null) : mem.get(key) ?? null;
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    console.error("kv get", key, e);
    return null;
  }
}

export async function setJSON(key: string, value: unknown, ttlSec = 60 * 60 * 24 * 400): Promise<boolean> {
  const raw = JSON.stringify(value);
  try {
    if (on()) await call(["SET", key, raw, "EX", ttlSec]);
    else mem.set(key, raw);
    return true;
  } catch (e) {
    console.error("kv set", key, e);
    return false;
  }
}

export const kvDurable = on;
