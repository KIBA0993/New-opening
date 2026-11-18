import "server-only";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

// Printable review signs for the Kit: a counter sign, a fold-in-half table tent and a sheet of
// 10 business-card size cards, all with the owner's Google review QR code. One PDF, 3 pages.

const IN = 72; // points per inch
const INK = rgb(0.11, 0.1, 0.086);
const MUTED = rgb(0.42, 0.39, 0.35);
const ACCENT = rgb(0.706, 0.267, 0.102);

// The built-in PDF fonts only cover Latin-1, so anything else (emoji, curly symbols) is dropped.
const latin = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").replace(/\s+/g, " ").trim();

function fit(font: PDFFont, text: string, max: number, maxWidth: number, min = 10) {
  let size = max;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

interface Fonts { head: PDFFont; body: PDFFont; bold: PDFFont }

/** Draws one sign centered in a box. Text is drawn upright relative to the box (rotation 0 or 180). */
function sign(page: PDFPage, f: Fonts, qr: PDFImage, o: { x: number; y: number; w: number; h: number; rotate180?: boolean; name: string; headline: string; sub: string; foot: string; scale: number }) {
  const s = o.scale;
  // For a 180° turn, draw around the box's opposite corner and rotate every element.
  const R = o.rotate180;
  const at = (dx: number, dy: number) => (R ? { x: o.x + o.w - dx, y: o.y + o.h - dy } : { x: o.x + dx, y: o.y + dy });
  const rot = R ? degrees(180) : degrees(0);
  const center = (text: string, font: PDFFont, size: number, dy: number, color = INK) => {
    const tw = font.widthOfTextAtSize(text, size);
    const p = at((o.w - tw) / 2, dy);
    page.drawText(text, { ...p, size, font, color, rotate: rot });
  };
  const pad = 0.35 * IN * s;
  let y = o.h - pad;
  const hs = fit(f.head, o.headline, 40 * s, o.w - 2 * pad);
  y -= hs;
  center(o.headline, f.head, hs, y);
  const ns = fit(f.bold, o.name, 20 * s, o.w - 2 * pad, 8);
  y -= ns + 8 * s;
  center(o.name, f.bold, ns, y, ACCENT);
  const q = Math.min(o.w - 2 * pad, o.h * 0.5);
  y -= q + 14 * s;
  const qp = at((o.w - q) / 2, y);
  // Rotating turns the image around its anchor corner, which at() already mirrored, so it lands in place.
  page.drawImage(qr, { ...qp, width: q, height: q, rotate: rot });
  const bs = 15 * s;
  for (const line of wrap(f.body, o.sub, bs, o.w - 2 * pad)) {
    y -= bs + 6 * s;
    center(line, f.body, bs, y);
  }
  if (o.foot) {
    const fs = 10.5 * s;
    for (const line of wrap(f.body, o.foot, fs, o.w - 2 * pad)) {
      y -= fs + 5 * s;
      center(line, f.body, fs, y, MUTED);
    }
  }
}

export async function reviewSignsPdf(o: { name: string; reviewUrl: string; serviceArea: boolean }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${latin(o.name)} review signs`);
  doc.setCreator("MapDebut");
  const f: Fonts = { head: await doc.embedFont(StandardFonts.TimesRomanBold), body: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
  const qr = await doc.embedPng(await QRCode.toBuffer(o.reviewUrl, { width: 900, margin: 1, errorCorrectionLevel: "M", color: { dark: "#1c1a16", light: "#ffffff" } }));
  const name = latin(o.name);
  const headline = o.serviceArea ? "Happy with our work?" : "Enjoyed your visit?";
  const sub = "Scan with your phone camera to leave us a quick Google review.";
  const foot = "It takes 30 seconds and helps neighbors find a new local business. Thank you!";

  // 1) Counter or wall sign, US Letter portrait.
  const p1 = doc.addPage([8.5 * IN, 11 * IN]);
  sign(p1, f, qr, { x: 0.5 * IN, y: 0.9 * IN, w: 7.5 * IN, h: 9.6 * IN, name, headline, sub, foot, scale: 1.6 });

  // 2) Table tent: Letter landscape, fold along the middle line; the top half is upside down so both sides read right.
  const p2 = doc.addPage([11 * IN, 8.5 * IN]);
  const half = 4.25 * IN;
  p2.drawLine({ start: { x: 0.4 * IN, y: half }, end: { x: 10.6 * IN, y: half }, thickness: 0.6, color: MUTED, dashArray: [4, 4] });
  p2.drawText("fold here", { x: 0.45 * IN, y: half + 4, size: 7, font: f.body, color: MUTED });
  const tent = { name, headline, sub, foot: "", scale: 0.9 };
  sign(p2, f, qr, { x: 2 * IN, y: 0.15 * IN, w: 7 * IN, h: half - 0.3 * IN, ...tent });
  sign(p2, f, qr, { x: 2 * IN, y: half + 0.15 * IN, w: 7 * IN, h: half - 0.3 * IN, rotate180: true, ...tent });

  // 3) Ten cards, 3.5 x 2 in, for receipts, bags and the truck window. Cut along the light lines.
  const p3 = doc.addPage([8.5 * IN, 11 * IN]);
  const cw = 3.5 * IN, ch = 2 * IN, left = 0.75 * IN, bottom = 0.5 * IN;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 2; c++) {
      const x = left + c * cw, y = bottom + r * ch;
      p3.drawRectangle({ x, y, width: cw, height: ch, borderColor: rgb(0.85, 0.82, 0.77), borderWidth: 0.5 });
      const q = ch - 0.3 * IN;
      p3.drawImage(qr, { x: x + 0.15 * IN, y: y + 0.15 * IN, width: q, height: q });
      const tx = x + 0.3 * IN + q, tw = cw - q - 0.45 * IN;
      let ty = y + ch - 0.42 * IN;
      const hs = fit(f.head, headline, 15, tw, 9);
      for (const line of wrap(f.head, headline, hs, tw)) {
        p3.drawText(line, { x: tx, y: ty, size: hs, font: f.head, color: INK });
        ty -= hs + 2;
      }
      ty -= 2;
      const ns = fit(f.bold, name, 10, tw, 6.5);
      for (const line of wrap(f.bold, name, ns, tw).slice(0, 2)) {
        p3.drawText(line, { x: tx, y: ty, size: ns, font: f.bold, color: ACCENT });
        ty -= ns + 2;
      }
      ty -= 3;
      for (const line of wrap(f.body, "Scan to leave a quick Google review. Thank you!", 8, tw)) {
        p3.drawText(line, { x: tx, y: ty, size: 8, font: f.body, color: INK });
        ty -= 10;
      }
    }
  }
  return doc.save();
}
