"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { beat } from "@/lib/track";

/** Counts one page view per page the visitor opens (for the admin page). */
export function PageBeat() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    beat({ p: path, r: first.current ? document.referrer : "" });
    first.current = false;
  }, [path]);
  return null;
}
