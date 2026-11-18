"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
}

export function SearchBox({ industry, autoFocus = false, size = "lg" }: { industry?: string; autoFocus?: boolean; size?: "lg" | "md" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const token = useRef<string>("");
  const listId = useId();
  const inputId = useId();

  useEffect(() => {
    token.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    const text = q.trim();
    // Phone numbers skip autocomplete and go straight to search.
    if (text.length < 3 || /^[\d\s()+.-]+$/.test(text)) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(text)}&token=${token.current}`, { signal: ctrl.signal });
        const data = await res.json();
        setItems(data.suggestions || []);
        setOpen(true);
        setActive(-1);
      } catch {
        /* typing again cancels the request */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const ind = industry ? `&industry=${industry}` : "";

  function go(s?: Suggestion) {
    if (s) {
      router.push(`/start?place=${encodeURIComponent(s.placeId)}&token=${token.current}${ind}`);
    } else if (q.trim().length >= 2) {
      router.push(`/start?q=${encodeURIComponent(q.trim())}${ind}`);
    }
  }

  const big = size === "lg";

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(active >= 0 ? items[active] : undefined);
      }}
      className="relative w-full"
    >
      <label htmlFor={inputId} className="sr-only">
        Your business name, address or phone number
      </label>
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-stretch sm:rounded-full sm:border-[1.5px] sm:border-ink sm:bg-white sm:p-1.5 ${big ? "" : ""}`}>
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !items.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Business name, address or phone"
          className={`field sm:!border-0 sm:!shadow-none sm:!rounded-full sm:flex-1 ${big ? "!min-h-[58px] sm:!min-h-[52px] text-[1.1rem]" : ""} border-ink`}
        />
        <button type="submit" className={`btn btn-accent ${big ? "!min-h-[56px] sm:!min-h-[52px] text-[1.05rem] sm:!px-7" : ""}`}>
          Check my business
        </button>
      </div>
      {open && items.length > 0 ? (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_30px_-12px_rgba(28,26,22,0.35)] sm:right-auto sm:min-w-[70%]">
          {items.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(s);
              }}
              className={`cursor-pointer px-4 py-3 ${i === active ? "bg-paper-3" : "hover:bg-paper"}`}
            >
              <span className="block font-semibold">{s.main}</span>
              <span className="block text-[0.88rem] text-ink-3">{s.secondary}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-[0.9rem] text-ink-3">Free. No sign-up. Takes about a minute.</p>
    </form>
  );
}
