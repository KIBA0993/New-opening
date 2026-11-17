"use client";
import QRCode from "qrcode";
import { useEffect, useId, useRef, useState } from "react";
import { CopyButton } from "@/components/CopyButton";

interface Suggestion { placeId: string; main: string; secondary: string }

export function ReviewLinkTool() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [qr, setQr] = useState("");
  const token = useRef("");
  const id = useId();

  useEffect(() => { token.current = crypto.randomUUID(); }, []);

  useEffect(() => {
    if (q.trim().length < 3 || picked) { setItems([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q.trim())}&token=${token.current}`, { signal: ctrl.signal });
        setItems((await r.json()).suggestions || []);
      } catch { /* cancelled */ }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, picked]);

  const link = picked ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(picked.placeId)}` : "";

  useEffect(() => {
    if (!link) { setQr(""); return; }
    QRCode.toDataURL(link, { width: 640, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [link]);

  return (
    <div>
      <label htmlFor={id} className="block font-semibold">Find your business on Google</label>
      <input
        id={id}
        className="field mt-2"
        placeholder="Business name and city"
        value={q}
        autoComplete="off"
        onChange={(e) => { setQ(e.target.value); setPicked(null); }}
      />
      {items.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-2xl border border-line bg-white">
          {items.map((s) => (
            <li key={s.placeId}>
              <button type="button" onClick={() => { setPicked(s); setQ(s.main); setItems([]); }} className="block w-full px-4 py-3 text-left hover:bg-paper">
                <span className="block font-semibold">{s.main}</span>
                <span className="block text-[0.88rem] text-ink-3">{s.secondary}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {picked && (
        <div className="card mt-6 p-5" aria-live="polite">
          <p className="font-semibold">Your review link for {picked.main}</p>
          <p className="mt-2 break-all text-ink-2">{link}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={link} label="Copy link" />
            <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-[44px]">Test it ↗</a>
          </div>
          {qr && (
            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR code for ${picked.main}'s Google review page`} className="h-44 w-44 rounded-lg border border-line bg-white p-2" />
              <div>
                <p className="text-ink-2">Print it for your counter, mirror, receipts or truck window.</p>
                <a href={qr} download={`${picked.main.replace(/\W+/g, "-")}-google-review-qr.png`} className="btn btn-primary mt-3 !min-h-[44px]">Download QR code</a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
