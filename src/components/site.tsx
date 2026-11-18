import Link from "next/link";
import { INDUSTRIES } from "@/lib/industries";

export function Wordmark() {
  return (
    <span className="font-display text-[1.35rem] font-semibold tracking-tight">
      MapDebut<span className="text-accent">.</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="MapDebut home" className="py-2">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-5 text-[0.95rem]">
          <Link href="/#how" className="hidden sm:inline py-2 text-ink-2 hover:text-ink">How it works</Link>
          <Link href="/#pricing" className="hidden sm:inline py-2 text-ink-2 hover:text-ink">Pricing</Link>
          <Link href="/guides" className="hidden sm:inline py-2 text-ink-2 hover:text-ink">Guides</Link>
          <Link href="/me" className="py-2 text-ink-2 hover:text-ink">Sign in</Link>
          <Link href="/start" className="btn btn-primary !min-h-[42px] !px-4 text-[0.95rem]">Free check</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6 text-[0.95rem]">
        <div>
          <Wordmark />
          <p className="mt-2 max-w-xs text-ink-3">The launch kit for new local businesses. Get found on Google, Maps and ChatGPT, then stay found.</p>
        </div>
        <div>
          <p className="font-semibold">Made for</p>
          <ul className="mt-2 space-y-1.5">
            {INDUSTRIES.map((i) => (
              <li key={i.slug}>
                <Link className="text-ink-2 hover:text-ink" href={`/for/${i.slug}`}>{i.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">MapDebut</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link className="text-ink-2 hover:text-ink" href="/start">Free check</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/autopilot">Weekly autopilot</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/tools/google-review-link">Free review QR code</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/guides">Guides</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/me">Sign in</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/account">Manage subscription</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/privacy">Privacy</Link></li>
            <li><Link className="text-ink-2 hover:text-ink" href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
