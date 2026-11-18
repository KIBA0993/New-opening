import { DemoTag, Pill } from "@/components/ui";
import { FREE_GRID, FULL_GRID, gridLive, mapGrid } from "@/lib/providers/grid";
import { getPlace } from "@/lib/providers/places";
import { checkContext } from "@/lib/report";
import type { IndustrySlug, Place } from "@/lib/types";

const TONE = (r: number | null) =>
  r == null ? "bg-[#d9d1c3] text-ink-3" : r <= 3 ? "bg-good text-white" : r <= 10 ? "bg-warn text-white" : "bg-bad text-white";

/** Google Maps positions around the shop: 3x3 in the free check, 5x5 for buyers. */
export async function MapGrid({ place, keyword, size = FREE_GRID, className = "mt-12" }: { place: Place; keyword: string; size?: number; className?: string }) {
  if (place.id === "new") return null;
  const grid = await mapGrid(place, keyword, size);
  const title = <h2 id="grid" className="font-display text-[1.7rem] leading-snug">Where you show up on Google Maps</h2>;

  if (!grid) {
    if (gridLive()) return null; // the lookup failed; skip quietly rather than guess
    return (
      <section aria-labelledby="grid" className={`card p-5 sm:p-7 ${className}`}>
        <Pill light="yellow">Coming soon</Pill>
        <div className="mt-3">{title}</div>
        <p className="mt-1 text-ink-2">
          We&apos;re adding a map of your Google Maps position for &ldquo;{keyword}&rdquo; from {size * size} spots around you. Check back in a day or two.
        </p>
      </section>
    );
  }

  const spots = grid.cells.length;
  const center = Math.floor(spots / 2);
  const across = Math.round(grid.spacingMiles * (grid.size - 1) * 10) / 10;
  const good = grid.top3 / spots;
  return (
    <section aria-labelledby="grid" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill light={good >= 0.5 ? "green" : good >= 0.2 ? "yellow" : "red"}>Top 3 in {grid.top3} of {spots} spots</Pill>
        <DemoTag show={grid.demo} />
      </div>
      <div className="mt-3">{title}</div>
      <p className="mt-1 text-ink-2">
        Your position for &ldquo;{grid.keyword}&rdquo; from {spots} spots across {across} miles around you. AI assistants lean on these same Maps results.
      </p>
      <div className="mx-auto mt-5 grid max-w-sm gap-1.5" style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))` }} role="table" aria-label="Google Maps position by location, north at top">
        {grid.cells.map((c, i) => (
          <div key={i} role="cell" className={`flex aspect-square items-center justify-center rounded-lg text-[1rem] font-semibold ${TONE(c.rank)} ${i === center ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""}`} aria-label={`${i === center ? "Your shop: " : ""}${c.rank ? `position ${c.rank}` : "not in the top 20"}`}>
            {c.rank ?? "20+"}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[0.9rem] text-ink-3">
        Outlined square is your shop. Green is top 3, amber is 4 to 10, red is 11 to 20.{grid.average ? ` Average position where you appear: ${grid.average}.` : ""}
        {grid.size < FULL_GRID ? ` The Launch Kit and Autopilot show a ${FULL_GRID}x${FULL_GRID} map that refreshes weekly.` : " Refreshes weekly."}
      </p>
    </section>
  );
}

/** The buyers' 5x5 map, looked up from the saved profile. Render inside <Suspense>. */
export async function BuyerMapGrid({ placeId, industry, className }: { placeId: string; industry: IndustrySlug; className?: string }) {
  if (placeId === "new") return null;
  const place = await getPlace(placeId).catch(() => null);
  if (!place) return null;
  return <MapGrid place={place} keyword={checkContext(place, industry).term} size={FULL_GRID} className={className} />;
}
