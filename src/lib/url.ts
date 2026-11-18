// Tracking parameters Google and ad tools add to a business's website link (utm_*, y_source, gclid...).
const TRACKING = /^(utm_\w+|y_source|gclid|gbraid|wbraid|fbclid|msclkid|mc_[ce]id|_ga|ref|srsltid)$/i;

/** The website without tracking junk, so owners paste a clean link on every listing. */
export function cleanUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}
