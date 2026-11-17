import { ImageResponse } from "next/og";

export const alt = "Opening Day: get your new business found on Google, Maps and ChatGPT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#f4efe6", color: "#1c1a16", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, fontFamily: "Georgia, serif" }}>
        <div style={{ fontSize: 34, fontWeight: 700, display: "flex" }}>Opening Day<span style={{ color: "#b4441a" }}>.</span></div>
        <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -1.5, display: "flex", maxWidth: 1000 }}>Your new business, found on Google, Maps and ChatGPT this week.</div>
        <div style={{ display: "flex", gap: 16, fontSize: 28, fontFamily: "Helvetica, Arial, sans-serif" }}>
          <span style={{ background: "#b4441a", color: "#fff", padding: "12px 24px", borderRadius: 999 }}>Free AI visibility check</span>
        </div>
      </div>
    ),
    size,
  );
}
