import "server-only";
import { headers } from "next/headers";
import { env } from "./env";

// Simple per-IP daily cap on free checks. In-memory, so it resets per server instance;
// good enough to stop casual abuse. Move to a shared store (e.g. Upstash) if it gets traffic.
const seen = new Map<string, { day: string; keys: Set<string> }>();

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export async function allowCheck(key: string): Promise<boolean> {
  const ip = await clientIp();
  const day = new Date().toISOString().slice(0, 10);
  let row = seen.get(ip);
  if (!row || row.day !== day) {
    row = { day, keys: new Set() };
    seen.set(ip, row);
  }
  if (row.keys.has(key)) return true;
  if (row.keys.size >= env.freeChecksPerDay) return false;
  row.keys.add(key);
  return true;
}
