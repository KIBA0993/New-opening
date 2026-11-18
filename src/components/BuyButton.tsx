"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/clientProfile";
import type { OwnerProfile } from "@/lib/types";

type Product = "kit" | "monthly" | "yearly";

/** Starts checkout with the owner's answers. If we don't have them (shared link), asks for them first. */
export function BuyButton({
  product,
  placeId,
  industry,
  children,
  className = "btn btn-primary w-full",
}: {
  product: Product;
  placeId?: string;
  industry?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  const matches = profile && (!placeId || profile.placeId === placeId || (placeId === "new" && profile.placeId === "new"));

  if (ready && !matches) {
    const href = placeId && placeId !== "new" ? `/start?place=${encodeURIComponent(placeId)}${industry ? `&industry=${industry}` : ""}` : "/start";
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  async function buy() {
    if (!profile) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, profile }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error);
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={buy} disabled={busy || !ready} className={className}>
        {busy ? "Opening secure checkout…" : children}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-bad">
          {error}
        </p>
      ) : null}
    </>
  );
}
