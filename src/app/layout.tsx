import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PageBeat } from "@/components/PageBeat";
import { DealBanner } from "@/components/DealBanner";
import { afterDealText, DEAL, dealEndLabel, dealOn } from "@/lib/deal";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site";

const display = Fraunces({ variable: "--font-display-face", subsets: ["latin"], axes: ["opsz", "SOFT"] });
const body = Instrument_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "MapDebut: get your new business found on Google, Maps and AI assistants", template: "%s · MapDebut" },
  description:
    "Free check: see if Google, Maps and AI assistants recommend your new local business, and who they pick instead. Then set up every profile in one afternoon.",
  openGraph: { type: "website", siteName: "MapDebut" },
  twitter: { card: "summary_large_image" },
  verification: { other: { "msvalidate.01": "A478BB225DB6C22ED3805354B3AA5B56" } },
};

export const viewport: Viewport = { themeColor: "#f4efe6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* Ship or Die hackathon traffic verification (must load in <head> on every page) */}
        <script defer src="https://www.ship-or-die.com/hackathon/verify.js" data-site="6cfadd6dc3f0d573003e898e85f34bb145ebba4e"></script>
      </head>
      <body className="min-h-dvh antialiased flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-primary">
          Skip to content
        </a>
        {dealOn() ? <DealBanner endsAt={DEAL.endsAt} endLabel={dealEndLabel()} after={afterDealText()} /> : null}
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
        <PageBeat />
      </body>
    </html>
  );
}
