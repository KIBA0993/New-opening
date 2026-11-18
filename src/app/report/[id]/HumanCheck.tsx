"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Turnstile, TURNSTILE_FAILED } from "@/components/Turnstile";

/** Shown instead of the free check when the visitor hasn't passed the bot check yet (e.g. a shared link). */
export function HumanCheck() {
  const router = useRouter();
  const [state, setState] = useState<"waiting" | "checking" | "failed">("waiting");

  async function onToken(token: string) {
    if (!token) return;
    setState("checking");
    const res = await fetch("/api/human", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => null);
    if (res?.ok) router.refresh();
    else setState("failed");
  }

  return (
    <div role="status" aria-live="polite" className="card mt-8 p-6">
      <p className="font-display text-[1.4rem]">{state === "failed" ? "We couldn't confirm you're a person" : "One moment…"}</p>
      <p className="mt-2 text-ink-2">
        {state === "failed"
          ? `Please reload the page to try again. ${TURNSTILE_FAILED}`
          : "We're making sure you're a person before we ask AI assistants about this business. This usually takes a second."}
      </p>
      <Turnstile onToken={onToken} onError={() => setState("failed")} />
    </div>
  );
}
