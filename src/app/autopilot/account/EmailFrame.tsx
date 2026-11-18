"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Shows a saved Autopilot email as it looked in the inbox. No scripts run inside; links open in a new tab. */
export function EmailFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);
  const fit = useCallback(() => {
    const d = ref.current?.contentDocument;
    if (d?.readyState === "complete" && d.documentElement.scrollHeight) setHeight(d.documentElement.scrollHeight + 8);
  }, []);
  // The frame can finish loading before the page wakes up, so measure on mount too, and again on resize.
  useEffect(() => {
    fit();
    const t = setTimeout(fit, 500);
    window.addEventListener("resize", fit);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fit);
    };
  }, [fit, html]);
  const withBase = /<html[^>]*>/i.test(html) ? html.replace(/<html[^>]*>/i, (m) => `${m}<head><base target="_blank"></head>`) : `<base target="_blank">${html}`;
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={withBase}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="mt-4 w-full rounded-xl border border-line bg-paper"
      style={{ height }}
      onLoad={fit}
    />
  );
}
