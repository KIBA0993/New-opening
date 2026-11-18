import "server-only";
import { env, has } from "../env";
import { searchJSON } from "./ai";
import { dataforseoReady } from "./dfs";

// DataForSEO "Google My Business Updates" returns a business's recent Google posts.
// It's task-based: we post tasks this week and read the results next week.
// Docs: https://docs.dataforseo.com/v3/business_data/google/my_business_updates/task_post/

const BASE = "https://api.dataforseo.com/v3/business_data/google/my_business_updates";

function auth() {
  return "Basic " + Buffer.from(`${env.dataforseoLogin}:${env.dataforseoPassword}`).toString("base64");
}

export async function postUpdateTasks(placeIds: string[]): Promise<string[]> {
  if (!has.dataforseo() || !placeIds.length || !(await dataforseoReady())) return [];
  const res = await fetch(`${BASE}/task_post`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(placeIds.map((id) => ({ keyword: `place_id:${id}`, location_code: 2840, language_code: "en", tag: id }))),
  }).catch(() => null);
  if (!res?.ok) return [];
  const data = (await res.json()) as { tasks?: { id: string; status_code: number }[] };
  return (data.tasks || []).filter((t) => t.status_code === 20100).map((t) => t.id);
}

export interface RivalPost {
  placeId: string;
  text: string;
  date?: string;
}

export async function readUpdateTasks(taskIds: string[], sinceDays = 10): Promise<RivalPost[]> {
  if (!has.dataforseo() || !taskIds.length) return [];
  const since = Date.now() - sinceDays * 864e5;
  const out: RivalPost[] = [];
  await Promise.all(
    taskIds.map(async (id) => {
      const res = await fetch(`${BASE}/task_get/${id}`, { headers: { Authorization: auth() } });
      if (!res.ok) return;
      const data = (await res.json()) as {
        tasks?: { data?: { tag?: string }; result?: { items?: { snippet?: string; post_text?: string; timestamp?: string; post_date?: string }[] }[] }[];
      };
      const task = data.tasks?.[0];
      for (const item of task?.result?.[0]?.items || []) {
        const date = item.timestamp || item.post_date;
        if (date && new Date(date).getTime() < since) continue;
        const text = item.post_text || item.snippet;
        if (text) out.push({ placeId: task?.data?.tag || "", text: text.slice(0, 280), date });
      }
    }),
  );
  return out;
}

/** Weekly sweep for deals and events rivals announced on their sites and socials. */
export async function rivalAnnouncements(rivals: { name: string }[], city: string): Promise<{ rival: string; move: string }[]> {
  if (!rivals.length) return [];
  const out = await searchJSON<{ moves?: { rival: string; move: string }[] }>(
    `Did any of these businesses in ${city} announce a new deal, promotion, menu item, service or event in the last 7 days (website, Google, Instagram, Facebook)?
${rivals.map((r) => `- ${r.name}`).join("\n")}
Only include things you found with a date in the last 7 days. Return JSON: {"moves":[{"rival":"exact name","move":"one short sentence"}]} or {"moves":[]}.`,
  );
  return (out?.moves || []).slice(0, 5);
}
