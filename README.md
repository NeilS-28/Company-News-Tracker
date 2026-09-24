# MarketPulse

Indian NSE and BSE company news, market quotes, deal headlines, and private watchlists.

[Live site](https://company-news-tracker.vercel.app/)

## What it does

- Search the checked-in equity master: 5,165 companies (2,578 with NSE symbols and 5,037 with BSE codes, with overlap).
- Read company, sector, and market news from Google News RSS and official NSE announcements RSS. A once-daily import keeps up to 30 days of headlines in Supabase; it does not claim complete exchange coverage. Optional NewsAPI and GNews keys enhance company news.
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

## Free-plan daily archive and account security

1. Run `supabase/migrations/002_marketpulse_news_security.sql` **once** in the Supabase SQL Editor, using the same project as migration 001. This creates a bounded article archive, source health, login throttling, and one-use email tokens; it grants `service_role` access. Existing accounts are marked verified when the new column is added, so existing users can continue to sign in.
2. In Vercel → Project → Settings → Environment Variables, add `CRON_SECRET` as a long random string (Production). Keep the existing `AUTH_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Do not prefix secrets with `NEXT_PUBLIC_`.
3. Deploy `vercel.json` with the code. Vercel Hobby invokes `/api/cron/ingest` **once daily** around 13:00 UTC (18:30 IST; invocation may occur later within the hour). The first archive rows appear after the first successful run. Visit `/api/providers` to inspect last successful checks; the news feed displays their status as well. The archive stores at most 70 recent rows per feed per day, deletes entries older than 30 days and keeps the normal live feed between runs. NSE RSS may fail or have gaps; the status shows failures rather than claiming full coverage. `CRON_SECRET` is automatically sent to the cron route by Vercel.
4. Optional, for verification and password reset: create a free Resend account, verify a domain you control, create an API key, and add `RESEND_API_KEY` and `MAIL_FROM` (for example `MarketPulse <news@yourdomain.com>`) in Vercel. Set `MARKETPULSE_SITE_URL=https://company-news-tracker.vercel.app` if you use a different production URL. Run migration 002 **before** adding mail settings. Redeploy after changing environment variables. New registrations will receive a verification link; existing users stay verified. The login modal links to password recovery. Without these email settings, signups continue with the current immediate-login flow and the recovery page reports that mail is not configured. The Supabase Auth built-in mail sender does not serve this app's custom auth.

The archive is intentionally small for Supabase Free (500 MB database limit), and the cron schedule fits Vercel Hobby's once-daily restriction. Mail requests are capped per address and IP; Resend Free currently offers 3,000 emails per month with a 100/day limit. Check provider limits again if usage increases. Daily ingestion is best effort, not a real-time feed.

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
- The official filings source is NSE RSS only. BSE-only announcements are not yet available as a verified official feed in the app; articles about BSE companies may still appear from regular news.
- The watchlist's “since last visit” marker is stored in that browser and is not synchronized across devices.
- A watchlist's home preview uses its latest 30 collected headlines; it is not a complete historical archive.
- The market overview's movers are selected from a small tracked subset, not ranked across all listed equities.

MarketPulse is for research and education, not financial advice. See [LICENSE](LICENSE).
