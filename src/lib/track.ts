"use client";
import { track as vercelTrack } from "@vercel/analytics";

/** Funnel event: goes to Vercel Analytics and to our own counters for the admin page. */
export function track(name: string, data?: Record<string, string | number | boolean | null>) {
  vercelTrack(name, data);
  beat({ e: name });
}

export function beat(body: Record<string, string>) {
  try {
    const json = JSON.stringify(body);
    if (!navigator.sendBeacon?.("/api/beat", new Blob([json], { type: "application/json" }))) {
      fetch("/api/beat", { method: "POST", body: json, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
    }
  } catch {}
}
