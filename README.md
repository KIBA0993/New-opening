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

Vercel: import the repo, add the env vars, done. `vercel.json` schedules the weekly email for Mondays 14:00 UTC.
