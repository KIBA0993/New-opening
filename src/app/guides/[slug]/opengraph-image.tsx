import { GUIDES_CONTENT, guideBySlug } from "@/lib/guides";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "A MapDebut guide for new local businesses";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return GUIDES_CONTENT.map((g) => ({ slug: g.slug }));
}

const TOPIC: Record<string, string> = { ai: "AI search guide", google: "Google profile guide", listings: "Listings guide", reviews: "Reviews guide", customers: "First customers guide" };

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  return ogCard({ kicker: (g?.topic && TOPIC[g.topic]) || "Guide", title: g?.title ?? "Guides for new local businesses", chip: "Free guide · mapdebut.com" });
}
