import "server-only";
import { env } from "../env";
import { spend, SpendCapError } from "../guard";
import { mentions, sameBrand } from "./ai";

// Directory check through Google's own business panel, via DataForSEO search results.
// One search per business ("<name> <address>", $0.002). When the panel on the right is that
// exact business (same Google place id), its "Profiles" row lists the pages the business
// linked itself: Facebook, Instagram and so on. Yelp counts when Google shows the business's
// Yelp page; when it doesn't, we say "can't tell" rather than guess "no".
// Docs: https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/

export interface DirectoryHit {
  yelp: boolean | null;
  facebook: boolean | null;
  /** Industry directory domains seen with this business's page in the top 10 results; null when the search failed. */
  others: string[] | null;
}

interface Node {
  type?: string;
  title?: string;
  website_name?: string;
  breadcrumb?: string;
  domain?: string;
  place_id?: string;
  items?: Node[];
}

const auth = () => "Basic " + Buffer.from(`${env.dataforseoLogin}:${env.dataforseoPassword}`).toString("base64");

// Google sometimes answers DataForSEO with a one-off "Internal SE Server Error" (40101, not billed).
// Retrying clears almost all of them.
async function search(keyword: string, tries = 3): Promise<Node[]> {
  try {
    return await searchOnce(keyword);
  } catch (e) {
    if (tries > 1 && !(e instanceof SpendCapError)) return search(keyword, tries - 1);
    throw e;
  }
}

async function searchOnce(keyword: string): Promise<Node[]> {
  await spend("dataforseo"); // throws once today's cap is used up; the rows then read "can't tell"
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify([{ keyword, language_code: "en", location_code: 2840, depth: 10 }]),
  });
  if (!res.ok) throw new Error(`DataForSEO ${res.status}`);
  const data = (await res.json()) as { tasks?: { status_code?: number; status_message?: string; result?: { items?: Node[] }[] }[] };
  const task = data.tasks?.[0];
  if (task?.status_code !== 20000) throw new Error(`DataForSEO ${task?.status_code} ${task?.status_message}`);
  return task.result?.[0]?.items || [];
}

const titles = (nodes: Node[] = []): string[] => nodes.flatMap((n) => [n.title || "", ...titles(n.items)]);

// Google hides real links behind a redirect, so organic results are read by site name and breadcrumb.
// A Yelp business page: website_name "Yelp", title "<NAME> - Updated ...". Google used to show the
// breadcrumb as "yelp.com › biz › <slug>" but now often shows "yelp.com › <slug>" (Nov 2026), so the
// title has to name the business; list pages ("TOP 10 BEST Spas in ...") and search pages don't count.
function yelpPage(i: Node, name: string) {
  if (i.type !== "organic") return false;
  const where = `${i.domain || ""} ${i.website_name || ""} ${i.breadcrumb || ""}`.toLowerCase();
  if (!where.includes("yelp") || /›\s*(search|topic|collection|c|list)\b/.test(i.breadcrumb || "")) return false;
  const title = (i.title || "").split(/ - | \| /)[0];
  return !/^(top|best|the \d+ best)\b/i.test(title) && sameBrand(title, name);
}

// Any other directory page about this business (Angi, BBB, Tripadvisor...): same site, title names the business.
function directoryPage(i: Node, name: string, domain: string) {
  if (i.type !== "organic") return false;
  const where = `${i.domain || ""} ${i.website_name || ""} ${i.breadcrumb || ""}`.toLowerCase();
  return where.includes(domain.toLowerCase()) && mentions(i.title || "", name);
}

/** Yelp, Facebook and the given industry directories for one business. Throws when the search fails. */
export async function directories(name: string, address: string, placeId?: string, domains: string[] = []): Promise<DirectoryHit> {
  const items = await search(`${name} ${address}`.replace(/\s+/g, " ").trim());
  const panel = items.find((i) => i.type === "knowledge_graph");
  const panelPlace = items.find((i) => i.type === "google_reviews")?.place_id;
  // Only trust the panel when Google says it's this exact place (or, without an id, the same name).
  const ours = !!panel && (placeId && panelPlace ? panelPlace === placeId : sameBrand(panel.title || "", name));
  const links = ours ? titles(panel!.items).map((t) => t.trim().toLowerCase()) : [];
  return {
    yelp: links.includes("yelp") || items.some((i) => yelpPage(i, name)) ? true : null,
    facebook: ours ? links.includes("facebook") : null,
    others: domains.filter((d) => items.some((i) => directoryPage(i, name, d)) || links.some((l) => l.length > 3 && d.startsWith(l.replace(/\s+/g, "")))),
  };
}

/** Same, but "can't tell" for both instead of throwing, so one failed search never breaks a report. */
export async function directoriesSafe(name: string, address: string, placeId?: string, domains: string[] = []): Promise<DirectoryHit> {
  try {
    return await directories(name, address, placeId, domains);
  } catch (e) {
    if (!(e instanceof SpendCapError)) console.error("listings search", name, e);
    return { yelp: null, facebook: null, others: null };
  }
}
