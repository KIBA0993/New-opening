import "server-only";
import { env, has } from "./env";
import { ENGINE_LABEL } from "./providers/ai";
import type { KitBlock } from "./kitDigest";
import type { WeeklyDigest } from "./types";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!has.resend()) {
    console.log(`[email:demo] to=${to} subject="${subject}" (${html.length} chars)`);
    return { ok: true, demo: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resend}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to: [to], reply_to: env.emailReplyTo, subject, html }),
  });
  if (!res.ok) console.error("Resend failed", res.status, await res.text());
  return { ok: res.ok, demo: false };
}

/** Save a lead to the Resend audience for follow-up (optional). */
export async function saveLead(email: string, firstName?: string) {
  if (!has.resend() || !env.resendAudience) return;
  await fetch(`https://api.resend.com/audiences/${env.resendAudience}/contacts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resend}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, first_name: firstName, unsubscribed: false }),
  }).catch(() => undefined);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const wrap = (inner: string) => `<!doctype html><html><body style="margin:0;background:#F4EFE6;font-family:Georgia,'Times New Roman',serif;color:#1C1A16">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<div style="font:600 13px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#B4441A">MapDebut</div>
${inner}
<p style="font:13px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#6B6459;margin-top:32px">You're getting this because you signed up at MapDebut. <a href="${env.siteUrl}/account" style="color:#6B6459">Manage or cancel</a>.</p>
</div></body></html>`;

const h2 = (t: string) => `<h2 style="font:600 20px/1.3 Georgia,serif;margin:28px 0 8px">${esc(t)}</h2>`;
const p = (t: string) => `<p style="font:16px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin:0 0 12px">${t}</p>`;
const box = (t: string) =>
  `<div style="background:#FBF8F2;border:1px solid #DDD3C2;border-radius:10px;padding:14px 16px;margin:8px 0 12px;font:15px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;white-space:pre-wrap">${esc(t)}</div>`;

export function renderDigestHtml(d: WeeklyDigest, links: { kit?: string; report?: string; account?: string; trial?: { renews: string; price: string; cancelUrl: string }; kitProgress?: KitBlock | null; google?: string; review?: string } = {}) {
  const k = links.kitProgress;
  const kitBox = k
    ? `<div style="background:#FBF8F2;border:1px solid #DDD3C2;border-radius:10px;padding:14px 16px;margin:16px 0">
<p style="font:600 16px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin:0 0 8px">Your Launch Kit: ${k.done} of ${k.total} steps done</p>
<div style="height:8px;background:#E8E0D2;border-radius:8px;overflow:hidden;margin:0 0 10px"><div style="height:8px;width:${Math.round((k.done / k.total) * 100)}%;background:#2F6B45"></div></div>
${k.next ? `<p style="font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin:0 0 10px">Next up: <b>${esc(k.next)}</b>. Most steps take 10 to 20 minutes.</p>` : `<p style="font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin:0 0 10px">Every step is done. Nice work. Now keep posting and asking for reviews.</p>`}
<a href="${k.url}" style="display:inline-block;background:#1C1A16;color:#F4EFE6;padding:10px 16px;border-radius:999px;text-decoration:none;font:600 14px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif">${k.next ? "Do the next step" : "Open your Kit"}</a>
<p style="font:13px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#6B6459;margin:10px 0 0">We re-check your Google profile, Yelp, directories and website each week and tick what's done.</p>
</div>`
    : "";
  const named = d.visibility.filter((v) => v.mentionsYou).length;
  const vis = d.visibility
    .map((v) => `${v.mentionsYou ? "🟢" : "🔴"} <b>${ENGINE_LABEL[v.engine]}</b> ${v.mentionsYou ? "named you" : "didn't name you"}`)
    .join("<br>");
  const moves = d.rivalMoves.length
    ? d.rivalMoves.map((m) => p(`<b>${esc(m.rival)}</b>: ${esc(m.move)}<br><span style="color:#2F6B45">Your move: ${esc(m.counter)}</span>`)).join("")
    : p("Quiet week. No big moves from your rivals.");
  const events = d.events
    .map((e) => `${p(`<b>${esc(e.title)}</b> · ${esc(e.date)} · ${esc(e.where)}<br>${esc(e.why)}${e.url ? ` <a href="${esc(e.url)}" style="color:#B4441A">Details</a>` : ""}`)}${box(e.pitch)}`)
    .join("");
  return wrap(`
<h1 style="font:600 28px/1.2 Georgia,serif;margin:12px 0 6px">${esc(d.business)}: your week of ${esc(d.weekOf)}</h1>
${p(`Five minutes, five things. Everything is written for you. Copy, paste, done.`)}
${links.account ? `<p style="font:13px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#6B6459;margin:0 0 12px"><a href="${links.account}#this-week" style="color:#6B6459">Read this on the web</a>, along with your past weeks.</p>` : ""}
${links.trial ? `<p style="font:14px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin:0 0 12px;background:#FBF8F2;border:1px solid #DDD3C2;border-radius:10px;padding:10px 14px">This is your free week of the Autopilot, included with your Launch Kit. It renews on <b>${esc(links.trial.renews)}</b> at <b>${esc(links.trial.price)}</b> until you cancel. <a href="${links.trial.cancelUrl}" style="color:#B4441A">Cancel in one click</a>.</p>` : ""}
${kitBox}
${h2(`1. Are AI tools recommending you? ${named} of ${d.visibility.length}`)}
${p(vis)}
${links.account ? p(`Changed something? <a href="${links.account}" style="color:#B4441A">Run a fresh check now</a> with one of your monthly re-checks.`) : ""}
${h2("2. What your rivals did")}
${moves}
${h2(k && k.week <= 4 ? `3. Your Google post for this week (week ${k.week} of your Kit)` : "3. Your Google post for this week")}
${box(d.googlePost)}
${p(`Paste it at <a href="https://business.google.com" style="color:#B4441A">business.google.com</a> → Add update.`)}
${h2(d.reviewReplies.length ? "4. Reviews to answer" : "4. Reviews")}
${
  d.reviewReplies.length
    ? d.reviewReplies.map((r) => p(`<i>${esc(r.review)}</i>`) + box(r.reply)).join("") +
      (links.google ? p(`Reply from <a href="${links.google}" style="color:#B4441A">your profile on Google Search</a> (signed in as the owner) → Reviews → Reply. Owners who reply get more reviews.`) : "")
    : p(`No new Google reviews in the last two weeks. Text your review link to 3 happy customers from this week, and ask them to mention the service they got.${links.review ? ` Your link: <a href="${links.review}" style="color:#B4441A">${esc(links.review)}</a>` : ""}`)
}
${h2(`5. Idea of the week: ${d.campaign.title}`)}
${p(esc(d.campaign.idea))}
${h2("Events near you to join or sponsor")}
${events || p("No good matches this week. We'll keep looking.")}
${links.kit ? p(`<a href="${links.kit}" style="color:#B4441A">Open your Launch Kit</a>`) : ""}
`);
}

export function renderKitEmail(name: string, kitUrl: string, trial?: { status: string; renews: string | null; price: string; cancelUrl: string } | null) {
  const trialBlock =
    trial && trial.status === "trialing"
      ? `${h2("Your free week of the Weekly Autopilot")}
${p(`Your first Autopilot email for ${esc(name)} is on its way in a separate email. Your free week ends on <b>${esc(trial.renews || "")}</b>. After that it renews at <b>${esc(trial.price)}</b>, billed to the card you used, until you cancel.`)}
${p(`Don't want it? <a href="${trial.cancelUrl}" style="color:#B4441A">Cancel the Autopilot in one click</a> before ${esc(trial.renews || "then")} and you won't be charged again. Your Launch Kit stays yours either way.`)}`
      : "";
  return wrap(`<h1 style="font:600 28px/1.2 Georgia,serif;margin:12px 0 6px">Your Launch Kit for ${esc(name)} is ready</h1>
${p("Everything is written. Set aside one afternoon, go step by step, and tap copy next to each piece.")}
${p(`<a href="${kitUrl}" style="display:inline-block;background:#1C1A16;color:#F4EFE6;padding:12px 18px;border-radius:999px;text-decoration:none">Open my Launch Kit</a>`)}
${p(`Keep this email. The link is your key to the kit. You can also <a href="${env.siteUrl}/me" style="color:#B4441A">sign in to your account</a> any time with this email address to see your Kit and your Autopilot in one place.`)}
${trialBlock}`);
}

export function renderReportEmail(name: string, reportUrl: string, headline: string) {
  return wrap(`<h1 style="font:600 28px/1.2 Georgia,serif;margin:12px 0 6px">Your free check for ${esc(name)}</h1>
${p(esc(headline))}
${p(`<a href="${esc(reportUrl)}" style="display:inline-block;background:#1C1A16;color:#F4EFE6;padding:12px 18px;border-radius:999px;text-decoration:none">See the full results</a>`)}`);
}
