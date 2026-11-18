import { NextResponse } from "next/server";
import { z } from "zod";
import { allow, allowIp } from "@/lib/guard";
import { kitOwner } from "@/lib/kitAccess";
import { checkAndSave, loadProgress, saveProgress } from "@/lib/kitCheck";
import { STEP_IDS } from "@/lib/kitSteps";

export const maxDuration = 60;

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("tick"), key: z.string().min(5).max(2000), step: z.enum(STEP_IDS), done: z.boolean() }),
  z.object({ action: z.literal("import"), key: z.string().min(5).max(2000), manual: z.record(z.string(), z.boolean()) }),
  z.object({ action: z.literal("check"), key: z.string().min(5).max(2000) }),
]);

// The Kit's progress: the owner's ticks plus our "Check my progress" results, saved per Kit.
export async function POST(req: Request) {
  if (!(await allowIp("kitprogress", 120, 600))) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const b = parsed.data;
  const profile = await kitOwner(b.key);
  if (!profile) return NextResponse.json({ error: "We couldn't open this Kit." }, { status: 404 });

  if (b.action === "check") {
    // Each check costs a few cents, so 6 a day per Kit is plenty.
    if (!(await allow("kitcheck", b.key.slice(-40), 6, 86400))) {
      return NextResponse.json({ error: "You've checked a few times today. Changes on Google and other sites can take a day or more to show, so try again tomorrow.", progress: await loadProgress(b.key) }, { status: 429 });
    }
    try {
      return NextResponse.json({ progress: await checkAndSave(b.key, profile) });
    } catch (e) {
      console.error("kit check", e);
      return NextResponse.json({ error: "The check didn't finish. Please try again in a minute." }, { status: 502 });
    }
  }

  const p = await loadProgress(b.key);
  if (b.action === "tick") p.manual[b.step] = b.done;
  else {
    // One-time move of ticks saved in this browser before progress was saved to the account.
    for (const id of STEP_IDS) if (b.manual[id] === true && p.manual[id] === undefined) p.manual[id] = true;
  }
  await saveProgress(b.key, p);
  return NextResponse.json({ progress: p });
}
