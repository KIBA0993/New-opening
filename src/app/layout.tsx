import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site";

const display = Fraunces({ variable: "--font-display-face", subsets: ["latin"], axes: ["opsz", "SOFT"] });
const body = Instrument_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Opening Day: get your new business found on Google, Maps and ChatGPT", template: "%s · Opening Day" },
  description:
    "Free check: see if Google, Maps and ChatGPT recommend your new local business, and who they pick instead. Then set up every profile in one afternoon.",
  openGraph: { type: "website", siteName: "Opening Day" },
};

export const viewport: Viewport = { themeColor: "#f4efe6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const tracker = process.env.NEXT_PUBLIC_TRACKER_SRC; // the hackathon's required traffic tracker
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-primary">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {tracker ? <Script src={tracker} strategy="afterInteractive" data-site={process.env.NEXT_PUBLIC_TRACKER_SITE} /> : null}
      </body>
    </html>
  );
}
