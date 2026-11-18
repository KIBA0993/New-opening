import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Cancel your Autopilot", robots: { index: false } };

type SP = Promise<{ session_id?: string; done?: string; error?: string }>;

// Where the emailed cancel link lands when Stripe's own cancel page can't open.
export default async function CancelPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const sessionId = (sp.session_id || "").slice(0, 300);
  const mail = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Please cancel my Autopilot")}`;
  return (
    <div className="mx-auto max-w-xl px-4 pt-12 sm:px-6">
      <p className="eyebrow">Weekly Autopilot</p>
      {sp.done ? (
        <>
          <h1 className="font-display mt-2 text-[2.2rem] leading-tight">Your Autopilot is cancelled</h1>
          <p className="mt-3 text-ink-2">You won&apos;t be charged again. If you were in your free week, it simply ends. Your Launch Kit stays yours.</p>
        </>
      ) : sp.error || !sessionId.startsWith("cs_") ? (
        <>
          <h1 className="font-display mt-2 text-[2.2rem] leading-tight">We couldn&apos;t cancel it from here</h1>
          <p className="mt-3 text-ink-2">
            Email <a className="link" href={mail}>{CONTACT_EMAIL}</a> and we&apos;ll cancel it the same day. You won&apos;t be charged for anything after the day you write to us.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display mt-2 text-[2.2rem] leading-tight">Cancel your Weekly Autopilot</h1>
          <p className="mt-3 text-ink-2">It stops at the end of the period you&apos;ve paid for, and nothing is charged after that. If you&apos;re in your free week, you won&apos;t be charged at all. Your Launch Kit stays yours.</p>
          <form method="post" action="/api/cancel" className="mt-6">
            <input type="hidden" name="session_id" value={sessionId} />
            <button type="submit" className="btn btn-primary w-full sm:w-auto">Cancel my Autopilot</button>
          </form>
          <p className="mt-4 text-[0.9rem] text-ink-3">
            Trouble? Email <a className="link" href={mail}>{CONTACT_EMAIL}</a>.
          </p>
        </>
      )}
    </div>
  );
}
