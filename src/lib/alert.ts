import "server-only";
import { allow } from "./guard";
import { sendEmail } from "./email";
import { recordAlert } from "./stats";

// Emails the owner when money stops flowing: checkout errors, failed renewals, buyers who
// didn't get what they paid for. One email per kind of problem per 30 minutes, so a burst
// doesn't flood the inbox. Everything also goes to the Vercel logs.
const TO = () => process.env.ALERT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@mapdebut.com";
const WINDOW_SEC = 30 * 60;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function alertOwner(kind: string, subject: string, details: Record<string, unknown> = {}) {
  console.error(`[alert:${kind}] ${subject}`, details);
  try {
    await recordAlert(kind, subject);
    if (!(await allow("alert", kind, 1, WINDOW_SEC))) return; // already alerted about this recently
    const rows = Object.entries(details)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td style="padding:4px 0">${esc(String(v instanceof Error ? v.message : v)).slice(0, 600)}</td></tr>`)
      .join("");
    const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">
<p><strong>${esc(subject)}</strong></p>
${rows ? `<table>${rows}</table>` : ""}
<p style="color:#666">Check Stripe (Payments and Events) and the Vercel logs. More of the same problem in the next 30 minutes won't send another email.</p></div>`;
    await sendEmail(TO(), `[MapDebut alert] ${subject}`, html);
  } catch (e) {
    console.error("alert failed", e);
  }
}

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
