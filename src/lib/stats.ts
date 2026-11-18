import "server-only";
import { createHash } from "node:crypto";
import { env } from "./env";
import { peek } from "./guard";
import { sourceKey, type Named } from "./sources";

// Our own traffic counters for the admin page. Stored in Upstash Redis when it's set up
// (shared by every server, kept for 400 days). Without it, counts live in one server's
// memory and reset on each deploy, so the admin page says so.

export const EVENTS = ["search", "details", "check_started", "check_finished", "checkout", "sticky_bar", "email_report", "kit_paid", "autopilot_paid"] as const;
export type StatEvent = (typeof EVENTS)[number];

const TZ = "America/New_York";
export const dayKey = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
const KEEP = 60 * 60 * 24 * 400;

export const statsDurable = () => !!(env.upstashUrl && env.upstashToken);

type Cmd = (string | number)[];
async function redis(cmds: Cmd[]): Promise<unknown[] | null> {
  if (!statsDurable()) return null;
  try {
    const res = await fetch(`${env.upstashUrl}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.upstashToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmds.map((c) => c.map(String))),
      cache: "no-store",
    });
    const out = (await res.json()) as { result?: unknown }[];
    return out.map((o) => o.result ?? null);
  } catch (e) {
    console.error("stats", e);
    return null;
  }
}

// In-memory fallback (one server only).
const mem = { n: new Map<string, number>(), sets: new Map<string, Set<string>>(), z: new Map<string, Map<string, number>>(), list: [] as string[] };
const memIncr = (k: string, by = 1) => mem.n.set(k, (mem.n.get(k) || 0) + by);
const memAdd = (k: string, v: string) => (mem.sets.get(k) || mem.sets.set(k, new Set()).get(k)!).add(v);
const memZ = (k: string, m: string) => {
  const z = mem.z.get(k) || mem.z.set(k, new Map()).get(k)!;
  z.set(m, (z.get(m) || 0) + 1);
};

/** A visitor id that can't be turned back into an IP: hashed with a salt that changes daily. */
function visitorId(ip: string, ua: string) {
  return createHash("sha256").update(`${dayKey()}|${ip}|${ua}|${env.authSecret || "mapdebut"}`).digest("base64url").slice(0, 16);
}

const pageName = (path: string) =>
  path.replace(/\?.*$/, "").replace(/^\/report\/[^/]+/, "/report/…").replace(/^\/kit.*/, "/kit").replace(/^\/b\/[^/]+/, "/b/…").slice(0, 80) || "/";

/**
 * One page view. When `visit` is set this is the first page of a new visit: it's counted
 * against the source that brought the visitor, and as a landing page.
 */
export async function recordView(path: string, ip: string, ua: string, visit?: Named) {
  const d = dayKey();
  const v = visitorId(ip, ua);
  const page = pageName(path);
  const src = visit ? sourceKey(visit) : "";
  const r = await redis([
    ["INCR", `st:pv:${d}`], ["EXPIRE", `st:pv:${d}`, KEEP], ["INCR", "st:pv:all"],
    ["PFADD", `st:uv:${d}`, v], ["EXPIRE", `st:uv:${d}`, KEEP],
    ["ZINCRBY", `st:pages:${d}`, 1, page], ["EXPIRE", `st:pages:${d}`, KEEP],
    ...(visit ? [
      ["ZINCRBY", `st:visits:${d}`, 1, src], ["EXPIRE", `st:visits:${d}`, KEEP],
      ["ZINCRBY", `st:land:${d}`, 1, page], ["EXPIRE", `st:land:${d}`, KEEP],
    ] : []),
  ]);
  if (r) return;
  memIncr(`st:pv:${d}`); memIncr("st:pv:all"); memAdd(`st:uv:${d}`, v); memZ(`st:pages:${d}`, page);
  if (visit) { memZ(`st:visits:${d}`, src); memZ(`st:land:${d}`, page); }
}

/** A funnel event, credited to the visitor's first outside source when we know it. */
export async function recordEvent(name: StatEvent, source?: Named) {
  const d = dayKey();
  const src = source ? sourceKey(source) : "";
  const r = await redis([
    ["INCR", `st:e:${name}:${d}`], ["EXPIRE", `st:e:${name}:${d}`, KEEP], ["INCR", `st:e:${name}:all`],
    ...(src ? [["ZINCRBY", `st:es:${name}:${d}`, 1, src], ["EXPIRE", `st:es:${name}:${d}`, KEEP]] : []),
  ]);
  if (!r) { memIncr(`st:e:${name}:${d}`); memIncr(`st:e:${name}:all`); if (src) memZ(`st:es:${name}:${d}`, src); }
}

export async function recordAlert(kind: string, subject: string) {
  const row = JSON.stringify({ at: Date.now(), kind, subject });
  const r = await redis([["LPUSH", "st:alerts", row], ["LTRIM", "st:alerts", 0, 49]]);
  if (!r) { mem.list.unshift(row); mem.list.length = Math.min(mem.list.length, 50); }
}

// ---------- Reading, for the admin page ----------

export function lastDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(Date.now() - i * 864e5)));
  return out;
}

export interface SourceRow { name: string; channel: string; visits: number; checks: number; checkouts: number; paid: number }
export const SOURCE_DAYS = 30;
// Counters that are credited to a source, and the column each one fills.
const BY_SOURCE: [string, keyof Omit<SourceRow, "name" | "channel">][] = [
  ["st:visits", "visits"], ["st:es:check_finished", "checks"], ["st:es:checkout", "checkouts"], ["st:es:kit_paid", "paid"], ["st:es:autopilot_paid", "paid"],
];

function sourceRows(lists: [string, number][][]): SourceRow[] {
  const rows = new Map<string, SourceRow>();
  lists.forEach((list, i) => {
    for (const [key, n] of list) {
      const [name, channel = "Other sites"] = key.split("|");
      const row = rows.get(key) || rows.set(key, { name, channel, visits: 0, checks: 0, checkouts: 0, paid: 0 }).get(key)!;
      row[BY_SOURCE[i][1]] += n;
    }
  });
  return [...rows.values()].sort((a, b) => b.paid - a.paid || b.checks - a.checks || b.visits - a.visits);
}

export interface Snapshot {
  days: string[];
  views: number[];
  visitors: number[];
  visitors7: number;
  viewsAll: number;
  events: Record<StatEvent, { days: number[]; all: number }>;
  pages: [string, number][];
  /** Last 30 days, by first-touch source. */
  sources: SourceRow[];
  /** Last 30 days, first page of each visit. */
  landing: [string, number][];
  alerts: { at: number; kind: string; subject: string }[];
  durable: boolean;
}

const pairs = (flat: unknown): [string, number][] => {
  const a = Array.isArray(flat) ? flat : [];
  const out: [string, number][] = [];
  for (let i = 0; i < a.length; i += 2) out.push([String(a[i]), Number(a[i + 1])]);
  return out;
};

export async function snapshot(nDays = 14): Promise<Snapshot> {
  const days = lastDays(nDays);
  const week = days.slice(-7);
  const month = lastDays(SOURCE_DAYS);
  const cmds: Cmd[] = [
    ...days.map((d) => ["GET", `st:pv:${d}`]),
    ...days.map((d) => ["PFCOUNT", `st:uv:${d}`]),
    ["PFCOUNT", ...week.map((d) => `st:uv:${d}`)],
    ["GET", "st:pv:all"],
    ...EVENTS.flatMap((e) => [...days.map((d) => ["GET", `st:e:${e}:${d}`]), ["GET", `st:e:${e}:all`]]),
    ["ZUNIONSTORE", "st:tmp:pages", week.length, ...week.map((d) => `st:pages:${d}`)],
    ["ZREVRANGE", "st:tmp:pages", 0, 9, "WITHSCORES"],
    ...BY_SOURCE.flatMap(([k], i) => [["ZUNIONSTORE", `st:tmp:src${i}`, month.length, ...month.map((d) => `${k}:${d}`)], ["ZREVRANGE", `st:tmp:src${i}`, 0, 99, "WITHSCORES"]]),
    ["ZUNIONSTORE", "st:tmp:land", month.length, ...month.map((d) => `st:land:${d}`)],
    ["ZREVRANGE", "st:tmp:land", 0, 9, "WITHSCORES"],
    ["LRANGE", "st:alerts", 0, 19],
  ];
  const r = await redis(cmds);
  const num = (x: unknown) => Number(x) || 0;
  if (r) {
    let i = 0;
    const take = (n: number) => r.slice(i, (i += n));
    const views = take(days.length).map(num);
    const visitors = take(days.length).map(num);
    const visitors7 = num(take(1)[0]);
    const viewsAll = num(take(1)[0]);
    const events = Object.fromEntries(EVENTS.map((e) => { const v = take(days.length + 1).map(num); return [e, { days: v.slice(0, -1), all: v[v.length - 1] }]; })) as Snapshot["events"];
    take(1); const pages = pairs(take(1)[0]);
    const sources = sourceRows(BY_SOURCE.map(() => { take(1); return pairs(take(1)[0]); }));
    take(1); const landing = pairs(take(1)[0]);
    const alerts = ((take(1)[0] as string[]) || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    return { days, views, visitors, visitors7, viewsAll, events, pages, sources, landing, alerts, durable: true };
  }
  const n = (k: string) => mem.n.get(k) || 0;
  const zSum = (prefix: string, span: string[]) => {
    const sum = new Map<string, number>();
    for (const d of span) for (const [k, v] of mem.z.get(`${prefix}:${d}`) || []) sum.set(k, (sum.get(k) || 0) + v);
    return [...sum].sort((a, b) => b[1] - a[1]);
  };
  const wk = new Set<string>();
  for (const d of week) for (const v of mem.sets.get(`st:uv:${d}`) || []) wk.add(v);
  return {
    days,
    views: days.map((d) => n(`st:pv:${d}`)),
    visitors: days.map((d) => mem.sets.get(`st:uv:${d}`)?.size || 0),
    visitors7: wk.size,
    viewsAll: n("st:pv:all"),
    events: Object.fromEntries(EVENTS.map((e) => [e, { days: days.map((d) => n(`st:e:${e}:${d}`)), all: n(`st:e:${e}:all`) }])) as Snapshot["events"],
    pages: zSum("st:pages", week).slice(0, 10),
    sources: sourceRows(BY_SOURCE.map(([k]) => zSum(k, month))),
    landing: zSum("st:land", month).slice(0, 10),
    alerts: mem.list.map((s) => JSON.parse(s)),
    durable: false,
  };
}

/** Today's paid API calls against the daily caps (caps count by UTC day). */
export async function spendToday() {
  const day = new Date().toISOString().slice(0, 10);
  const kinds = [
    { kind: "ai", label: "Claude (AI answers and writing)", cap: env.aiDailyCap },
    { kind: "places", label: "Google Places", cap: env.placesDailyCap },
    { kind: "dataforseo", label: "DataForSEO", cap: env.dataforseoDailyCap },
  ];
  return Promise.all(kinds.map(async (k) => ({ ...k, used: await peek(`cap:${k.kind}:${day}`) })));
}
