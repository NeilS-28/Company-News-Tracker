# MarketPulse

Indian NSE and BSE company news, market quotes, deal headlines, and private watchlists.

[Live site](https://company-news-tracker.vercel.app/)

## What it does

- Search the checked-in equity master: 5,165 companies (2,578 with NSE symbols and 5,037 with BSE codes, with overlap).
- Read company, sector, and market news from Google News RSS. Optional NewsAPI and GNews keys enhance company news.
- View available Yahoo Finance quotes. Missing prices remain unavailable; they are never generated. Quote times come from the provider, and the UI distinguishes live, delayed, and closed states.
- Follow companies in private Supabase-backed watchlists. Signed-in users see headlines from their first populated watchlist on the home page, with a browser-local count of stories since their previous visit.
- Browse Deal Radar headlines with automated keyword-based labels. A label does not verify a deal or an exchange filing; open the linked publisher or the company's official investor relations site to confirm it.
- Switch between cream/red light and black/ivory/red dark themes.

## Stack

Next.js 16.3.5, React 19, TypeScript, Vercel, and Supabase for production accounts and watchlists. The equity master is stored in `src/db/equities_master.json`. Local development can use the JSON file store in `data/db.json`.

## Local setup

```bash
git clone https://github.com/NeilS-28/Company-News-Tracker.git
cd Company-News-Tracker
npm ci
cp .env.example .env.local
npm run dev
```

Set a long random `AUTH_SECRET` in `.env.local`. To test persistent accounts and watchlists, also configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and run `supabase/migrations/001_marketpulse_persistence.sql` in Supabase. The secret key stays on the server; never use a `NEXT_PUBLIC_` prefix. The Supabase service role also needs permissions on the three `marketpulse_*` tables and their identity sequence. Without Supabase settings, the app uses local file storage for development.

`NEWS_API_KEY` and `GNEWS_API_KEY` are optional. Google News RSS and Yahoo Finance are external providers, so coverage, delays, and availability can vary. The provider timestamp beside each quote is more meaningful than when the page last fetched data.

## Checks and maintenance

```bash
npm test
npm run build
npm run equities:validate
```

For a production build, set `AUTH_SECRET` before running `npm run build`. To refresh the equity master from the exchange sources, run `npm run equities:refresh` and review the resulting file before committing it.

## Limitations

- News matching, sentiment, category, and Deal Radar labels use headline and snippet heuristics. They can misclassify stories.
- The watchlist's “since last visit” marker is stored in that browser and is not synchronized across devices.
- A watchlist's home preview uses its latest 30 collected headlines; it is not a complete historical archive.
- The market overview's movers are selected from a small tracked subset, not ranked across all listed equities.

MarketPulse is for research and education, not financial advice. See [LICENSE](LICENSE).
