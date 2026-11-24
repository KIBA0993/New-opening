import { ImageResponse } from "next/og";

// Share images (1200x630) in the site's style, one per page type: each vertical, trade and guide
// gets its own headline instead of the site-wide image.
export const OG_SIZE = { width: 1200, height: 630 };

export function ogCard({ kicker, title, chip }: { kicker: string; title: string; chip: string }) {
  const size = title.length > 90 ? 50 : title.length > 60 ? 60 : 70;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#f4efe6", color: "#1c1a16", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 700, display: "flex" }}>MapDebut<span style={{ color: "#b4441a" }}>.</span></div>
          <div style={{ fontSize: 24, color: "#b4441a", textTransform: "uppercase", letterSpacing: 2, fontFamily: "Helvetica, Arial, sans-serif", display: "flex" }}>{kicker}</div>
        </div>
        <div style={{ fontSize: size, lineHeight: 1.08, letterSpacing: -1.2, display: "flex", maxWidth: 1050 }}>{title}</div>
        <div style={{ display: "flex", gap: 16, fontSize: 28, fontFamily: "Helvetica, Arial, sans-serif" }}>
          <span style={{ background: "#b4441a", color: "#fff", padding: "12px 24px", borderRadius: 999 }}>{chip}</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
