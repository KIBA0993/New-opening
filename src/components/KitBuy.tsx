"use client";
import { useSyncExternalStore } from "react";
import { BuyButton } from "@/components/BuyButton";

// One choice per visitor, shared by every Kit button on the page (and remembered), so the
// sticky bar and the offer cards never disagree about whether the free week is included.
const KEY = "md_kit_trial";
const listeners = new Set<() => void>();
function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}
function write(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Launch Kit buy button with the free-week checkbox right above it. Ticked by default:
 * the Kit plus a free Autopilot week that then renews monthly. Unticked: the Kit only.
 */
export function KitBuy({
  kitLabel,
  monthlyLabel,
  trialDays,
  placeId,
  industry,
  className = "btn btn-accent w-full",
  dark = false,
  compact = false,
}: {
  kitLabel?: string;
  monthlyLabel: string;
  trialDays: number;
  placeId?: string;
  industry?: string;
  className?: string;
  dark?: boolean;
  compact?: boolean;
}) {
  const trial = useSyncExternalStore(subscribe, read, () => true) && trialDays > 0;
  const week = trialDays === 7 ? "1 free week" : `${trialDays} free days`;
  return (
    <div className={compact ? "" : "w-full sm:w-auto"}>
      {trialDays > 0 ? (
        <label className={`mb-2 flex cursor-pointer items-start gap-2 leading-snug ${compact ? "text-[0.8rem]" : "text-[0.9rem]"} ${dark ? "text-[#e3dccf]" : "text-ink-2"}`}>
          <input type="checkbox" checked={trial} onChange={(e) => write(e.target.checked)} className="mt-[0.2em] h-4 w-4 shrink-0 accent-[#b4441a]" />
          <span>Include {week} of Autopilot, then {monthlyLabel}/mo, cancel anytime.</span>
        </label>
      ) : null}
      <BuyButton product={trial ? "kit" : "kit_only"} placeId={placeId} industry={industry} className={className}>
        {kitLabel ? (trial ? `Pay ${kitLabel} and start free week` : `Pay ${kitLabel}`) : trial ? "Get the Kit and start free week" : "Get the Launch Kit"}
      </BuyButton>
    </div>
  );
}
