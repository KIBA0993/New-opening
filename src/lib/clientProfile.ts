"use client";
import type { OwnerProfile } from "./types";

const KEY = "od_profile_v1";

export function saveProfile(p: OwnerProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode: the flow still works, we just can't remember it */
  }
}

export function loadProfile(): OwnerProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OwnerProfile) : null;
  } catch {
    return null;
  }
}

export function reportPath(p: Pick<OwnerProfile, "placeId" | "industry" | "name" | "city">) {
  if (p.placeId === "new") {
    return `/report/new?industry=${p.industry}&name=${encodeURIComponent(p.name)}&city=${encodeURIComponent(p.city)}`;
  }
  return `/report/${encodeURIComponent(p.placeId)}?industry=${p.industry}`;
}
