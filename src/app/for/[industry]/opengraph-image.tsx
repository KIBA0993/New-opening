import { OG_SIZE, ogCard } from "@/lib/og";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import { TRADES, tradeBySlug } from "@/lib/trades";

export const alt = "MapDebut: get your new business found on Google, Maps and AI assistants";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return [...INDUSTRIES.map((i) => ({ industry: i.slug })), ...TRADES.map((t) => ({ industry: t.slug }))];
}

export default async function OG({ params }: { params: Promise<{ industry: string }> }) {
  const slug = (await params).industry;
  const trade = tradeBySlug(slug);
  const ind = industryBySlug(slug);
  const title = trade?.h1 ?? ind?.hero.title ?? "Your new business, found on Google, Maps and AI assistants this week.";
  const kicker = trade ? `For new ${trade.name.toLowerCase()} businesses` : ind ? `For ${ind.name.toLowerCase()}` : "For new businesses";
  return ogCard({ kicker, title, chip: "Free AI visibility check" });
}
