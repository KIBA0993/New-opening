import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentEmail } from "@/lib/auth";
import { purchasesFor, type Purchase } from "@/lib/billing";
import { has } from "@/lib/env";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

function Row({ p }: { p: Purchase }) {
  const date = new Date(p.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const kit = p.product === "kit";
  return (
    <li className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{p.business}</p>
        <p className="text-[0.92rem] text-ink-3">
          {kit ? "Launch Kit" : `Weekly Autopilot, ${p.product === "yearly" ? "yearly" : "monthly"}`} · {date}
          {!kit && p.active === false ? " · ended" : ""}
        </p>
      </div>
      {kit ? (
        <Link href={`/kit?session_id=${p.sessionId}`} className="btn btn-primary">Open Launch Kit</Link>
      ) : p.active === false ? (
        <Link href="/autopilot" className="btn btn-ghost">Restart</Link>
      ) : (
        <Link href={`/autopilot/account?session_id=${p.sessionId}`} className="btn btn-primary">Re-checks and settings</Link>
      )}
    </li>
  );
}

export default async function Me() {
  const email = await currentEmail();
  if (!email) redirect("/signin?next=/me");
  const purchases = await purchasesFor(email).catch((e) => {
    console.error("purchases", e);
    return [] as Purchase[];
  });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="eyebrow">Your account</p>
      <h1 className="font-display mt-2 text-[2.2rem] leading-tight">Welcome back</h1>
      <p className="mt-1 text-ink-3">Signed in as {email}</p>

      {purchases.length ? (
        <ul className="mt-8 space-y-3">
          {purchases.map((p) => <Row key={p.sessionId} p={p} />)}
        </ul>
      ) : (
        <div className="card mt-8 p-6">
          <p className="font-display text-[1.4rem]">Nothing here yet</p>
          <p className="mt-2 text-ink-2">
            {has.stripe()
              ? "We couldn't find a Launch Kit or Autopilot bought with this email. If you paid with a different email, sign out and use that one."
              : "Sample mode: purchases show up here once payments are turned on."}
          </p>
          <Link href="/start" className="btn btn-primary mt-5">Run a free check</Link>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/account" className="btn btn-ghost">Billing and receipts</Link>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="btn btn-ghost">Sign out</button>
        </form>
      </div>
    </div>
  );
}
