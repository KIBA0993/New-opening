import { SITE_URL } from "./site";

// Who writes MapDebut's guides. Shown as the byline on every guide and on /about.
// Edit here to change the name, bio or links everywhere at once.
export const FOUNDER = {
  name: process.env.NEXT_PUBLIC_FOUNDER_NAME || "KIBA",
  role: "Founder of MapDebut",
  bio: "Builds MapDebut, the launch kit for new local businesses. Tests what Google, Maps and AI assistants show for brand-new businesses every week, and writes up what works.",
  x: "https://x.com/KIBA0993",
  url: `${SITE_URL}/about`,
};

export function founderLd() {
  return { "@type": "Person", name: FOUNDER.name, jobTitle: FOUNDER.role, url: FOUNDER.url, sameAs: [FOUNDER.x] };
}
