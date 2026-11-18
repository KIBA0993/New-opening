import { BuyButton } from "@/components/BuyButton";
import { KIT_TRIAL_DAYS } from "@/lib/deal";
import { PRICES } from "@/lib/env";

/**
 * The auto-renewal terms, shown right next to every Launch Kit button (the Kit includes a free
 * Autopilot week that then renews), plus the way to buy the Kit alone.
 */
export function KitTrialNote({ placeId, industry, dark = false, className = "" }: { placeId?: string; industry?: string; dark?: boolean; className?: string }) {
  if (KIT_TRIAL_DAYS <= 0) return null;
  const week = KIT_TRIAL_DAYS === 7 ? "1 week" : `${KIT_TRIAL_DAYS} days`;
  return (
    <p className={`text-[0.88rem] leading-snug ${dark ? "text-[#bdb4a5]" : "text-ink-3"} ${className}`}>
      Includes {week} of the Weekly Autopilot free. Then {PRICES.monthly.label}/month until you cancel, which takes one click from your email.{" "}
      <BuyButton product="kit_only" placeId={placeId} industry={industry} className={`inline underline underline-offset-4 ${dark ? "text-[#e3dccf]" : "text-ink-2"}`}>
        Kit only, no Autopilot
      </BuyButton>
    </p>
  );
}
