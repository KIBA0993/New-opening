// The Launch Kit's 12 steps, shared by the Kit page, the progress check and the Autopilot email.

export const STEP_IDS = ["details", "facts", "google", "verify", "apple", "bing", "yelp", "facebook", "chatgpt", "directories", "website", "reviews"] as const;
export type StepId = (typeof STEP_IDS)[number];

export const STEP_TITLE: Record<StepId, string> = {
  details: "Use the same name, address and phone everywhere",
  facts: "Add your credentials, facts and prices",
  google: "Fill in your Google profile",
  verify: "Pass Google's verification",
  apple: "Get on Apple Maps",
  bing: "Get on Bing",
  yelp: "Get on Yelp",
  facebook: "Get on Facebook",
  chatgpt: "Get on ChatGPT",
  directories: "Get on your industry's directories",
  website: "Make your website easy for AI to quote",
  reviews: "Get your first 10 reviews",
};

/** Steps our check can't see from public data, so the owner ticks them. */
export const MANUAL_STEPS: StepId[] = ["apple", "bing", "chatgpt"];

export type CheckState = "done" | "todo" | "unknown";

export interface StepCheck {
  state: CheckState;
  found: string[]; // what we saw that's already right
  missing: string[]; // what's still missing
}

export interface KitProgress {
  manual: Partial<Record<StepId, boolean>>; // the owner's own ticks (they win over the check)
  check: { at: string; steps: Partial<Record<StepId, StepCheck>> } | null;
}

export const emptyProgress = (): KitProgress => ({ manual: {}, check: null });

/** A step counts as done when the owner ticked it, or our check confirmed it and they didn't untick it. */
export function isDone(p: KitProgress, id: StepId): boolean {
  const m = p.manual[id];
  if (typeof m === "boolean") return m;
  return p.check?.steps[id]?.state === "done";
}

export function doneCount(p: KitProgress) {
  return STEP_IDS.filter((id) => isDone(p, id)).length;
}

export function nextStep(p: KitProgress): StepId | null {
  return STEP_IDS.find((id) => !isDone(p, id)) || null;
}
