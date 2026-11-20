import { DemoTag, Pill } from "@/components/ui";
import { FREE_GRID, FULL_GRID, gridLive, gridSentence, mapFrame, mapGrid } from "@/lib/providers/grid";
import { getPlace, locateTown } from "@/lib/providers/places";
import { checkContext } from "@/lib/report";
import type { IndustrySlug, Place } from "@/lib/types";

const TONE = (r: number | null) =>
  r == null ? "bg-[#8a8378] text-white" : r <= 3 ? "bg-good text-white" : r <= 10 ? "bg-warn text-white" : "bg-bad text-white";

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
  const good = grid.top3 / spots;
  const frame = mapFrame(grid);
  const mapUrl = `/api/staticmap?lat=${frame.lat.toFixed(5)}&lng=${frame.lng.toFixed(5)}&z=${frame.zoom}`;
  const pin = spots > 9 ? "h-8 w-8 text-[0.85rem]" : "h-11 w-11 text-[1rem]";
  return (
    <section aria-labelledby="grid" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill light={good >= 0.5 ? "green" : good >= 0.2 ? "yellow" : "red"}>Top 3 in {grid.top3} of {spots} spots</Pill>
        <DemoTag show={grid.demo} />
      </div>
      <div className="mt-3">{title}</div>
      <p className="font-display mt-2 text-[1.25rem] leading-snug">{gridSentence(grid)}</p>
      <p className="mt-1 text-ink-2">
        Each pin is where someone nearby searches &ldquo;{grid.keyword}&rdquo;, and the number is where you show up in Google Maps from there. AI assistants lean on these same results.
      </p>
      <div
        className="relative mx-auto mt-5 aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-line bg-paper-3 bg-center bg-no-repeat"
        style={grid.demo ? undefined : { backgroundImage: `url(${mapUrl})`, backgroundSize: `${frame.scale * 100}%` }}
        role="img"
        aria-label={`Map of Google Maps positions around your shop. ${gridSentence(grid)}`}
      >
        {grid.cells.map((c, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-semibold shadow-md ring-2 ring-white ${pin} ${TONE(c.rank)} ${i === center ? "outline outline-2 outline-offset-2 outline-ink" : ""}`}
            style={{ left: `${frame.pins[i].x}%`, top: `${frame.pins[i].y}%` }}
          >
            {c.rank ?? "20+"}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-[0.9rem] text-ink-3">
        {place.serviceArea ? `The outlined pin is the center of ${place.city?.split(",")[0] || "your town"}.` : "The outlined pin is your shop."} Green is top 3, amber is 4 to 10, red is 11 to 20, gray is not in the top 20.{grid.average ? ` Average position where you appear: ${grid.average}.` : ""}
        {grid.size < FULL_GRID ? ` The Launch Kit and Autopilot show a ${FULL_GRID}x${FULL_GRID} map that refreshes weekly.` : " Refreshes weekly."}
      </p>
    </section>
  );
}

/** The buyers' 5x5 map, looked up from the saved profile. Render inside <Suspense>. */
export async function BuyerMapGrid({ placeId, industry, town, className }: { placeId: string; industry: IndustrySlug; town?: string; className?: string }) {
  if (placeId === "new") return null;
  const place = await getPlace(placeId).then((p) => p && locateTown(p, town)).catch(() => null);
  if (!place) return null;
  return <MapGrid place={place} keyword={checkContext(place, industry).term} size={FULL_GRID} className={className} />;
}
