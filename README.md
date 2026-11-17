# Opening Day

Get a new local business found on Google, Maps and ChatGPT. Built for the Ship or Die hackathon (from scratch, Nov 17, 2026).

## What's here

| Page | What it does |
| --- | --- |
| `/` and `/for/[industry]` | Home and six industry landing pages (home services, beauty, food trucks, pet, wellness, restaurants) with the one-box search |
| `/start` | One-box onboarding: name, address or phone → "Is this you?" → do you manage it → 4 short questions → email |
| `/report/[placeId]` | Free check: ChatGPT, Perplexity and Gemini answers, 5 nearby rivals, listings on Google, Apple, Bing, Yelp, Facebook, ChatGPT, green/yellow/red, shareable |
| `/kit?session_id=` | Paid Launch Kit: AI-written Google profile, verification coach, guided setup on 6 platforms, review link, QR card, templates, progress checklist |
| `/autopilot` | Weekly Autopilot sales page with a sample Monday email |
| `/api/cron/weekly` | Monday cron: emails every active subscriber (AI re-check, rival moves, Google post, review replies, campaign idea, events with pitches) |
| `/api/digest-preview` | Preview the real weekly email for any business (needs `CRON_SECRET`) |

No database: the owner's answers travel in Stripe checkout and subscription metadata, AI results are cached a day with Next's data cache, and Google data is always fetched fresh (Places terms).

## Run it

```bash
npm install
cp .env.example .env.local   # every key is optional
npm run dev
```

Without keys everything runs on sample data, including checkout (it skips Stripe and opens the kit directly). In demo mode, search "brand new bakery" to see the not-on-Google path.

## Deploy

With only `ANTHROPIC_API_KEY` set, Claude does all the AI work: the kit, the weekly email, web search for listings, rivals and events, and the free check (3 customer questions to Claude). Add OpenAI, Perplexity or Gemini keys later and each becomes another row in the check. AI answers are cached per question and city for a day, so the next owner in the same area gets them instantly. The Google readiness score shows in about 2 seconds, before any AI call.

Vercel: import the repo, add the env vars, done. `vercel.json` schedules the weekly email for Mondays 14:00 UTC.

## SEO and AI search (GEO)

- `sitemap.xml`, `robots.txt` (AI crawlers allowed; private pages blocked), `llms.txt`, a default share image, canonical URLs.
- Structured data: Organization, SoftwareApplication with prices, FAQPage on home, industry pages, guides and tools; Article, HowTo and BreadcrumbList on guides.
- Pages that target searches: 10 guides in `src/lib/guides.ts` (`/guides/...`) and two free tools: `/tools/chatgpt-visibility-checker` and `/tools/google-review-link`.
- Every guide opens with a 2 to 3 sentence "short answer", the part AI tools quote.
- `NEXT_PUBLIC_SITE_URL` is baked in at build time, so set it before the first Vercel build.
