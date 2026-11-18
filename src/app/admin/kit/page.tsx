import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { directoriesFor } from "@/lib/directories";
import { PRICES } from "@/lib/env";
import { guessIndustry, industryBySlug } from "@/lib/industries";
import { AI_ROBOTS, businessSchema, writeKit } from "@/lib/kit";
import { GUIDES } from "@/lib/platforms";
import { getPlace, reviewLink, searchBusinesses } from "@/lib/providers/places";
import { suggestAnswers } from "@/lib/suggest";
import type { IndustrySlug, OwnerProfile } from "@/lib/types";
import { KitView } from "../../kit/KitView";

// Admin only: see the real Launch Kit for any business without a purchase (for demos and QA).
// Uses the same AI writer and cache as a paid kit; no Stripe calls, no emails.
export const metadata: Metadata = { title: "Kit preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SP = Promise<{ q?: string; place?: string; industry?: string }>;

export default async function KitPreview({ searchParams }: { searchParams: SP }) {
  if (!(await isAdmin())) redirect("/admin");
  const { q, place: placeId, industry: ind } = await searchParams;

  if (!placeId) {
    const found = q ? (await searchBusinesses(q)).places : [];
    return (
      <div className="mx-auto max-w-xl px-4 pt-12">
        <p className="eyebrow">Admin</p>
        <h1 className="font-display mt-2 text-[2rem]">Preview a Launch Kit</h1>
        <form className="mt-5 flex gap-2">
          <input name="q" defaultValue={q} placeholder="Business name and city" className="field" required />
          <button className="btn btn-primary shrink-0">Search</button>
        </form>
        <ul className="mt-6 space-y-2">
          {found.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/kit?place=${encodeURIComponent(p.id)}`} className="card block p-4 hover:border-ink">
                <span className="block font-semibold">{p.name}</span>
                <span className="text-ink-3">{p.address}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const place = await getPlace(placeId);
  if (!place) return <p className="mx-auto max-w-xl px-4 pt-12">Couldn&apos;t find that place.</p>;
  const industry = (industryBySlug(ind)?.slug || guessIndustry(place.types, place.primaryType, place.name) || "home-services") as IndustrySlug;
  const s = await suggestAnswers({ placeId: place.id, name: place.name, address: place.address, city: place.city || "", industry, typeLabel: place.primaryTypeLabel, types: place.types, website: place.website });
  const profile: OwnerProfile = {
    placeId: place.id,
    name: place.name,
    address: place.address,
    city: place.city || place.address,
    phone: place.phone,
    website: place.website,
    industry,
    managesProfile: "unsure",
    services: s.services.join(", "),
    different: s.different,
    areas: s.areas.join(", "),
    email: "",
  };
  const key = `preview:${place.id}|${industry}`;
  const kit = await writeKit(key, profile);
  const info = industryBySlug(industry)!;

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <p className="rounded-xl bg-warn-bg p-3 text-[0.95rem] text-warn">
          Admin preview: this is the real kit a buyer of {place.name} would get, written from Google data and the AI-suggested answers ({industry}). Nothing was charged or emailed.
        </p>
      </div>
      <KitView
        kit={kit}
        profile={profile}
        guides={GUIDES}
        reviewUrl={reviewLink(profile.placeId)}
        serviceArea={info.serviceArea}
        storeKey={key}
        industryName={info.name}
        directories={directoriesFor(industry)}
        schema={businessSchema(profile, kit, info.serviceArea)}
        robots={AI_ROBOTS}
        autopilot={{ trial: null, accountUrl: "/autopilot", monthly: PRICES.monthly.label, yearly: PRICES.yearly.label, save: PRICES.yearly.save }}
      />
    </>
  );
}
