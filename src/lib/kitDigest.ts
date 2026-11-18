import "server-only";
import type Stripe from "stripe";
import { env } from "./env";
import { writeKit } from "./kit";
import { checkAndSave, loadProgress } from "./kitCheck";
import { doneCount, nextStep, STEP_IDS, STEP_TITLE } from "./kitSteps";
import type { OwnerProfile, WeeklyDigest } from "./types";

// For Kit buyers, the Autopilot email doubles as a coach: how far along the Kit they are, the next
// step, and for the first 4 weeks the Google post from their Kit for that week.

export interface KitBlock {
  url: string;
  done: number;
  total: number;
  next: string | null;
  week: number; // weeks since purchase, from 1
}

export async function kitBlock(checkout: Stripe.Checkout.Session | undefined, profile: OwnerProfile, opts: { check: boolean }): Promise<KitBlock | null> {
  if (!checkout || checkout.metadata?.product !== "kit") return null;
  const progress = opts.check ? await checkAndSave(checkout.id, profile).catch(() => loadProgress(checkout.id)) : await loadProgress(checkout.id);
  const next = nextStep(progress);
  return {
    url: `${env.siteUrl}/kit?session_id=${checkout.id}${next ? `#${next}` : ""}`,
    done: doneCount(progress),
    total: STEP_IDS.length,
    next: next ? STEP_TITLE[next] : null,
    week: Math.floor((Date.now() - checkout.created * 1000) / (7 * 864e5)) + 1,
  };
}

/** Weeks 1 to 4: use the post the Kit already wrote for that week (it's the plan the owner saw). */
export async function applyKitPost(digest: WeeklyDigest, block: KitBlock | null, checkoutId: string | undefined, profile: OwnerProfile) {
  if (!block || !checkoutId || block.week > 4) return;
  const kit = await writeKit(checkoutId, profile).catch(() => null);
  const post = kit?.posts?.[block.week - 1];
  if (post?.body) digest.googlePost = post.body;
}
