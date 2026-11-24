import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Study: an AI assistant named 6 of 122 new Chicago businesses (5%) when asked for the best nearby";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OG() {
  return ogCard({ kicker: "Research · Nov 2026", title: "Asked for the best nearby, an AI assistant named just 6 of 122 new Chicago businesses (5%).", chip: "Read the study · mapdebut.com" });
}
