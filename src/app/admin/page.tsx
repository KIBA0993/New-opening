import type { Metadata } from "next";
import { adminEnabled, isAdmin, sales } from "@/lib/admin";
import { snapshot, spendToday, type StatEvent } from "@/lib/stats";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

function Login({ e }: { e?: string }) {
  return (
    <div className="mx-auto max-w-sm px-4 pt-16">
      <h1 className="font-display text-[2rem]">Admin</h1>
      {!adminEnabled() ? (
        <p className="mt-3 text-ink-2">Set <code>ADMIN_PASSWORD</code> in Vercel, redeploy, then come back here.</p>
      ) : (
        <form method="post" action="/api/admin/login" className="mt-5 space-y-3">
          <label htmlFor="pw" className="font-semibold">Password</label>
          <input id="pw" name="password" type="password" autoComplete="current-password" required className="field" />
          {e === "wrong" ? <p role="alert" className="text-bad">That password isn&apos;t right.</p> : null}
          {e === "wait" ? <p role="alert" className="text-bad">Too many tries. Wait 15 minutes.</p> : null}
          <button className="btn btn-primary w-full">Open the dashboard</button>
        </form>
      )}
    </div>
  );
}

function Tile({ label, today, week, all, note }: { label: string; today: string | number; week: string | number; all?: string | number; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[0.85rem] font-semibold text-ink-3">{label}</p>
      <p className="font-display mt-1 text-[2rem] leading-none">{today}</p>
      <p className="mt-2 text-[0.85rem] text-ink-3">Today · {week} last 7 days{all != null ? ` · ${all} all time` : ""}</p>
      {note ? <p className="mt-1 text-[0.8rem] text-ink-3">{note}</p> : null}
    </div>
  );
}

function Bars({ days, values }: { days: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="mt-4 flex gap-1" role="img" aria-label={`Visitors per day: ${values.join(", ")}`}>
      {values.map((v, i) => (
        <div key={days[i]} className="flex flex-1 flex-col items-center gap-1">
          <span className="h-4 text-[0.7rem] text-ink-3">{v || ""}</span>
          <div className="flex h-24 w-full items-end">
            <div className="w-full rounded-t bg-accent" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} />
          </div>
          <span className="text-[0.65rem] text-ink-3">{days[i].slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (!(await isAdmin())) return <Login e={(await searchParams).e} />;
  const [st, money, spend] = await Promise.all([snapshot(14), sales(), spendToday()]);
  const last = st.days.length - 1;
  const ev = (e: StatEvent) => st.events[e];
  const today = (e: StatEvent) => ev(e).days[last];
  const week = (e: StatEvent) => sum(ev(e).days.slice(-7));
  const weekDays = st.days.slice(-7);
  const salesToday = money.byDay[st.days[last]] || { kits: 0, autopilots: 0, revenue: 0 };
  const sales7 = weekDays.reduce((a, d) => { const r = money.byDay[d]; return r ? { kits: a.kits + r.kits, autopilots: a.autopilots + r.autopilots, revenue: a.revenue + r.revenue } : a; }, { kits: 0, autopilots: 0, revenue: 0 });
  const funnel: [StatEvent, string][] = [["search", "Searched for a business"], ["details", "Finished details"], ["check_started", "Opened a check"], ["check_finished", "Check finished"], ["checkout", "Started checkout"], ["kit_paid", "Bought the Launch Kit"], ["autopilot_paid", "Started the Autopilot"]];
  const top = week("search") || 1;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-16 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-[2.2rem]">MapDebut admin</h1>
        <p className="text-[0.85rem] text-ink-3">Days in US Eastern time · refresh for the latest</p>
      </div>
      {!st.durable ? (
        <p className="card mt-4 border-warn p-4 text-warn">
          Traffic counts aren&apos;t being saved yet. Add Upstash Redis (free) in Vercel and set <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code>. Until then, the numbers below come from one server and reset on every deploy. Sales come straight from Stripe, so they are always right.
        </p>
      ) : null}

      <h2 className="font-display mt-8 text-[1.5rem]">Traffic</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Tile label="Visitors" today={st.visitors[last]} week={st.visitors7} />
        <Tile label="Page views" today={st.views[last]} week={sum(st.views.slice(-7))} all={st.viewsAll} />
        <Tile label="Free checks finished" today={today("check_finished")} week={week("check_finished")} all={ev("check_finished").all} />
      </div>
      <div className="card mt-3 p-4">
        <p className="text-[0.85rem] font-semibold text-ink-3">Visitors per day, last 14 days</p>
        <Bars days={st.days} values={st.visitors} />
      </div>

      <h2 className="font-display mt-10 text-[1.5rem]">Sales</h2>
      {!money.connected ? <p className="mt-2 text-ink-3">Stripe isn&apos;t connected here.</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Tile label="Revenue" today={usd(salesToday.revenue)} week={usd(sales7.revenue)} all={usd(money.all.revenue)} />
        <Tile label="Launch Kits" today={salesToday.kits} week={sales7.kits} all={money.all.kits} />
        <Tile label="Autopilot sign-ups" today={salesToday.autopilots} week={sales7.autopilots} all={money.all.autopilots} note={`${money.activeSubs} active · ${usd(money.mrr)} a month recurring`} />
      </div>
      {money.recent.length ? (
        <ul className="card mt-3 divide-y divide-line p-0">
          {money.recent.map((r) => (
            <li key={r.at + r.what} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-[0.95rem]">
              <span><span className="font-semibold">{r.what}</span>{r.business ? ` · ${r.business}` : ""}</span>
              <span className="text-ink-3">{usd(r.amount)} · {new Date(r.at).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <h2 className="font-display mt-10 text-[1.5rem]">Funnel, last 7 days</h2>
      <div className="card mt-3 p-4">
        <ul className="space-y-3">
          {funnel.map(([e, label], i) => {
            const n = week(e);
            const prev = i ? week(funnel[i - 1][0]) : 0;
            return (
              <li key={e}>
                <div className="flex justify-between gap-2 text-[0.95rem]">
                  <span>{label}</span>
                  <span className="font-semibold">{n}{i ? <span className="font-normal text-ink-3"> · {pct(n, prev)} of previous</span> : null}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-paper-3"><div className="h-2 rounded bg-accent" style={{ width: `${Math.min(100, (n / top) * 100)}%` }} /></div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[0.8rem] text-ink-3">Today: {funnel.map(([e, l]) => `${l.split(" ")[0].toLowerCase()} ${today(e)}`).join(" · ")}. Also: phone bar taps {week("sticky_bar")}, reports emailed {week("email_report")}.</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="font-display text-[1.5rem]">Top pages, 7 days</h2>
          <ul className="card mt-3 divide-y divide-line p-0">
            {st.pages.length ? st.pages.map(([p, n]) => <li key={p} className="flex justify-between gap-2 px-4 py-2 text-[0.92rem]"><span className="truncate">{p}</span><span className="font-semibold">{n}</span></li>) : <li className="px-4 py-3 text-ink-3">No views yet</li>}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-[1.5rem]">Where visitors came from</h2>
          <ul className="card mt-3 divide-y divide-line p-0">
            {st.refs.length ? st.refs.map(([r, n]) => <li key={r} className="flex justify-between gap-2 px-4 py-2 text-[0.92rem]"><span className="truncate">{r}</span><span className="font-semibold">{n}</span></li>) : <li className="px-4 py-3 text-ink-3">No outside links yet (direct visits don&apos;t show here)</li>}
          </ul>
        </section>
      </div>

      <h2 className="font-display mt-10 text-[1.5rem]">API use today (UTC day)</h2>
      <ul className="card mt-3 divide-y divide-line p-0">
        {spend.map((s) => (
          <li key={s.kind} className="px-4 py-3">
            <div className="flex justify-between gap-2 text-[0.95rem]"><span>{s.label}</span><span className="font-semibold">{s.used} of {s.cap} calls</span></div>
            <div className="mt-1 h-2 rounded bg-paper-3"><div className={`h-2 rounded ${s.used / s.cap > 0.8 ? "bg-bad" : "bg-good"}`} style={{ width: `${Math.min(100, (s.used / s.cap) * 100)}%` }} /></div>
          </li>
        ))}
      </ul>

      <h2 className="font-display mt-10 text-[1.5rem]">Recent alerts</h2>
      <ul className="card mt-3 divide-y divide-line p-0">
        {st.alerts.length ? st.alerts.map((a) => (
          <li key={a.at + a.kind} className="px-4 py-3 text-[0.92rem]">
            <span className="font-semibold">{a.subject}</span>
            <span className="block text-ink-3">{new Date(a.at).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {a.kind}</span>
          </li>
        )) : <li className="px-4 py-3 text-ink-3">No alerts. Good.</li>}
      </ul>
    </div>
  );
}
