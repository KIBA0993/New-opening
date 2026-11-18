import "server-only";
import { getJSON, setJSON } from "./kv";

// A copy of every Autopilot email, so owners can read this week's (and past weeks') on the site,
// not only in their inbox. Kept per subscription in the small JSON store, newest first.

export interface SavedEmail {
  at: number;
  subject: string;
  html: string;
}

const KEEP = 12; // about three months of Mondays
const key = (subId: string) => `ap-emails:${subId}`;

export async function archiveEmail(subId: string, subject: string, html: string) {
  const list = (await getJSON<SavedEmail[]>(key(subId))) || [];
  list.unshift({ at: Date.now(), subject, html });
  await setJSON(key(subId), list.slice(0, KEEP));
}

export async function archivedEmails(subId: string): Promise<SavedEmail[]> {
  return (await getJSON<SavedEmail[]>(key(subId))) || [];
}
