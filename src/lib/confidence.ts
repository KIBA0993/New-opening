// Before the free check runs: are we sure we have the right listing, town and kind of business?
// When we're not, the report asks the owner instead of guessing. Pure (no network), so the
// tricky-lead tests in tests/ run it against real cases.

import { guessIndustry, industryBySlug, industryForTerm, searchTerm } from "./industries";
import type { IndustrySlug, Place } from "./types";

export type DoubtKind = "closed" | "hidden-address" | "category" | "no-industry";

export interface Doubt {
  kind: DoubtKind;
  note: string; // shown to the owner, plain words
}

/** What we read from the website, when we could. */
export interface SiteSignals {
  kind?: string; // what the site says it is ("dance studio")
  termHint?: string; // wellness wording ("health coach")
  labelSeen?: boolean | null; // Google's category words appear on the site
}

/**
 * Google categories that don't say what the business does. Nobody searches "best health near me" or
 * "best association near me", and "Sports School" covers dance programs, swim schools and karate.
 */
const CATCH_ALL = /^(health|wellness|sports school|school|educational institution|association( \/ | or |\/)organization|non-?profit organization|point of interest|establishment|service|store|corporate office|community center|consultant|business center|event venue)$/;

export const isCatchAll = (label?: string) => !!label && CATCH_ALL.test(label.toLowerCase().trim());

export interface Confidence {
  doubts: Doubt[];
  term: string; // our best guess at what customers search for, prefilled for the owner to confirm
  industry: IndustrySlug | undefined; // best guess, prefilled
}

export function checkConfidence(place: Place, site: SiteSignals | null, chosenIndustry?: IndustrySlug): Confidence {
  const doubts: Doubt[] = [];
  const label = place.primaryTypeLabel;

  if (place.status === "CLOSED_PERMANENTLY") {
    doubts.push({ kind: "closed", note: "Google shows this listing as permanently closed. If you have a newer listing, pick that one instead." });
  }
  if (place.serviceArea || (place.lat == null && place.id !== "new" && !place.id.startsWith("demo_"))) {
    doubts.push({ kind: "hidden-address", note: "Your Google profile hides your address, so we need the town you serve." });
  }

  const guessed = guessIndustry(place.types, place.primaryType, place.name);
  const siteKind = site?.termHint || site?.kind;
  if (isCatchAll(label)) {
    doubts.push({ kind: "category", note: `Google files you under "${label}", which doesn't say what you do.` });
  } else if (label && site?.kind && site.labelSeen === false) {
    // Google says one thing, the website never uses those words and clearly says another.
    doubts.push({ kind: "category", note: `Google files you as "${label}", but your website talks about ${site.kind === "tutoring" ? "tutoring" : pluralish(site.kind)}.` });
  }
  if (!chosenIndustry && !guessed && !doubts.some((d) => d.kind === "category")) {
    doubts.push({ kind: "no-industry", note: label ? `We don't have a set of customer questions for "${label}" yet.` : "Google doesn't say what kind of business this is." });
  }

  // Best guess for the owner to confirm: the website's own words when Google's category is in doubt.
  const doubtful = doubts.some((d) => d.kind === "category" || d.kind === "no-industry");
  const industry = chosenIndustry || (doubtful && siteKind ? industryForTerm(siteKind) : undefined) || guessed || (siteKind ? industryForTerm(siteKind) : undefined);
  const term = doubtful && siteKind ? siteKind : searchTerm(industryBySlug(industry) || industryBySlug("home-services")!, label, { ...place, termHint: place.termHint || site?.termHint });
  return { doubts, term, industry };
}

function pluralish(kind: string) {
  return /s$/.test(kind) ? kind : `${kind.replace(/ (studio|school)$/, "")}`;
}

/** Cleans what the owner typed as their business type: short, plain words only. */
export function cleanOwnerTerm(raw?: string | null): string | undefined {
  const t = (raw || "").toLowerCase().replace(/[^a-z0-9&' -]/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);
  return t.length >= 3 ? t : undefined;
}
