"use client";
import { track } from "@/lib/track";
import { useEffect } from "react";

/** Sends one funnel event when it first renders (e.g. when the AI check finishes streaming in). */
export function TrackOnce({ name, data }: { name: string; data?: Record<string, string | number | boolean | null> }) {
  useEffect(() => {
    track(name, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
