"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { beat } from "@/lib/track";
import { encodeSource, readSource, SOURCE_COOKIE } from "@/lib/sources";

/**
 * Counts page views for the admin page. The first page of each visit (per tab) also says what
 * brought the visitor here, and the first outside source a browser ever arrives from is kept for
 * 90 days so free checks and purchases can be credited to it. Coming back from Stripe or from
 * another page of ours is not a new visit.
 */
export function PageBeat() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!first.current) {
      beat({ p: path });
      return;
    }
    first.current = false;
    let fresh = true;
    try {
      fresh = !sessionStorage.getItem("md_visit");
      sessionStorage.setItem("md_visit", "1");
    } catch {}
    if (!fresh) {
      beat({ p: path });
      return;
    }
    const raw = readSource(location.search, document.referrer);
    const enc = raw ? encodeSource(raw) : "";
    if (enc && !document.cookie.split("; ").some((c) => c.startsWith(`${SOURCE_COOKIE}=`))) {
      document.cookie = `${SOURCE_COOKIE}=${enc}; path=/; max-age=${90 * 86400}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    }
    beat({ p: path, v: "1", s: enc });
  }, [path]);
  return null;
}
