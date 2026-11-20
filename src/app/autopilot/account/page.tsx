import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BuyerMapGrid } from "@/components/MapGrid";
import { DemoTag } from "@/components/ui";
import { applyTopup, CREDITS, getAccount } from "@/lib/credits";
import { ReCheck } from "./ReCheck";
import { EmailFrame } from "./EmailFrame";
import { archivedEmails } from "@/lib/emailArchive";

export const metadata: Metadata = { title: "Your Autopilot", robots: { index: false } };

type SP = Promise<{ session_id?: string; topup?: string; added?: string; week?: string }>;

export default async function AccountPage({ searchParams }: { searchParams: SP }) {
  const { session_id, topup, added, week } = await searchParams;
  const account = session_id ? await getAccount(session_id) : null;
  if (!account || !session_id) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-14">
        <h1 className="font-display text-[2.2rem]">We couldn&apos;t find that Autopilot</h1>
        <p className="mt-3 text-ink-2">Open this page from the link in your weekly email. If your subscription ended, you can restart it any time.</p>
        <Link href="/autopilot" className="btn btn-primary mt-6">See the Autopilot</Link>
      </div>
    );
  }
  const justAdded = (topup ? await applyTopup(topup, account) : false) || added === "1";
  const fromMonth = Math.max(0, account.allowance - account.used);
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="flex items-center gap-2">
        <p className="eyebrow">Weekly Autopilot</p>
        <DemoTag show={account.demo} />
      </div>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight sm:text-[2.6rem]">{account.profile.name}</h1>
      <p className="mt-2 text-ink-2">Your weekly email checks AI assistants every Monday. Want to see if a change worked sooner? Run a fresh check here.</p>

      {justAdded ? <p role="status" className="card mt-6 p-4 font-semibold text-good">Added {CREDITS.topupCount} re-checks. Thank you!</p> : null}

      <section className="card mt-6 p-5 sm:p-7">
        <ReCheck sessionId={session_id} initialLeft={account.left} topupLabel={`Add ${CREDITS.topupCount} more for $${CREDITS.topupPrice}`} />
        <p className="mt-5 text-[0.92rem] text-ink-3">
          {fromMonth} of {account.allowance} from this month&apos;s allowance{account.extra ? `, plus ${account.extra} extra` : ""}. Your allowance resets on {nextMonth}. Extra re-checks never expire.
        </p>
      </section>

      <ThisWeek subId={account.subId} sessionId={session_id} week={Number(week) || 0} />
      <Suspense fallback={null}>
        <BuyerMapGrid placeId={account.profile.placeId} industry={account.profile.industry} town={account.profile.city} className="card mt-6 p-5 sm:p-7" />
      </Suspense>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/report/${encodeURIComponent(account.profile.placeId)}?industry=${account.profile.industry}`} className="btn btn-ghost">See your full check</Link>
        <Link href="/me" className="btn btn-ghost">Your account</Link>
        <a href={`/api/cancel?session_id=${encodeURIComponent(session_id)}`} className="btn btn-ghost">Cancel the Autopilot</a>
      </div>
    </div>
  );
}

const shortDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });

/** This week's Autopilot email on the web, with the past weeks under it. */
async function ThisWeek({ subId, sessionId, week }: { subId: string | null; sessionId: string; week: number }) {
  const emails = subId ? await archivedEmails(subId) : [];
  const shown = emails[Math.min(Math.max(0, week), Math.max(0, emails.length - 1))];
  return (
    <section id="this-week" aria-labelledby="this-week-h" className="card mt-6 scroll-mt-6 p-5 sm:p-7">
      <h2 id="this-week-h" className="font-display text-[1.5rem]">{week > 0 && shown ? `Your email from ${shortDate(shown.at)}` : "This week's email"}</h2>
      {shown ? (
        <>
          <p className="mt-1 text-[0.92rem] text-ink-3">The same email we sent you, so it&apos;s here when you need it. Copy the post and replies straight from it.</p>
          <EmailFrame html={shown.html} title={shown.subject} />
          {emails.length > 1 ? (
            <nav aria-label="Past weeks" className="mt-4">
              <p className="text-[0.92rem] font-semibold">Past weeks</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {emails.map((e, i) => (
                  <li key={e.at}>
                    <Link
                      href={`/autopilot/account?session_id=${encodeURIComponent(sessionId)}${i ? `&week=${i}` : ""}#this-week`}
                      aria-current={e === shown ? "page" : undefined}
                      className={`inline-block rounded-full border px-3 py-1 text-[0.9rem] ${e === shown ? "border-ink bg-ink text-paper" : "border-line text-ink-2"}`}
                    >
                      {i === 0 ? "Latest" : shortDate(e.at)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-ink-2">Your Autopilot emails will show up here, starting with the next one. Each one comes on Monday morning.</p>
      )}
    </section>
  );
}