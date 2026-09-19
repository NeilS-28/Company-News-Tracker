# MarketPulse — Indian company news and research

[Live site](https://company-news-tracker.vercel.app) · Next.js 16 App Router · React 19 · TypeScript

MarketPulse brings company news, sector discovery, reported quotes, and private watchlists together. The committed catalogue contains 2,569 companies and 21 sectors. Catalogue membership and sector mappings are snapshots, not a continuously maintained exchange master.

## Features and data boundaries

- Company and sector search, news categories, headline filters, dark/light themes, and responsive layouts.
- Company pages render their initial research content on the server and have company-specific metadata.
- Yahoo Finance quotes, optionally preceded by Finnhub. Every quote includes its provider and the provider's market timestamp. Values may be delayed or represent the last session. Missing fields remain unavailable. Provider failure returns a clearly marked cached quote (retained at most 24 hours after retrieval), or no quote. **There are no simulated prices or volumes.**
- Market breadth is unavailable until a real breadth source is integrated. The market API's movers cover a named subset of companies, not the entire exchange.
- Google News RSS, with optional NewsAPI/GNews for company news. Article links and publication dates come from the provider. Stable URL-based IDs support bookmarks and deduplication. `Today` means the current calendar day in Asia/Kolkata.
- Seeded news is development sample content and is **never included in public feeds**. Directory cards do not claim sample-based news counts.
- Headline tone and Deal Radar statuses are automated keyword labels, **not verified sentiment, exchange filings, or investment recommendations**. Deal labels say “reported”; links to investor-relations portals are provided for independent checking.
- Email-link sign-in and Supabase-backed watchlists with ownership checks in both the API and PostgreSQL row-level security (RLS). Up to 20 lists per account and 100 companies per list. News aggregation covers the first 20 companies, with an explicit notice for longer lists.

## Local development

Use Node.js 22 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The committed company catalogue works without seeding. Without Supabase settings, public research continues to work and watchlists show an unavailable state; no shared or temporary server-file watchlist is used.

`npm run db:seed` regenerates the catalogue and development sample records. It does not modify Supabase accounts or watchlists. Preserve company IDs when updating catalogue data because watchlist memberships reference those IDs. The old global JSON watchlists and browser-local stars are not automatically imported into private accounts.

## Enable private watchlists

1. Create a Supabase project. In its SQL editor, run `supabase/migrations/202609190001_private_watchlists.sql` once. Keep RLS enabled on both tables. This is a new-table migration, not a migration of an existing unrelated schema.
2. Copy the project URL and its public **anon key** into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not use the service-role/secret key. The application verifies bearer tokens with Supabase Auth and forwards the user's token to PostgreSQL through the Supabase API; it does not bypass RLS.
3. Enable email authentication. Keep the default Magic Link email template. Configure the Auth Site URL to your deployed origin and allow `https://company-news-tracker.vercel.app/watchlists` as a redirect. Add `http://localhost:3000/watchlists` for local testing and the exact preview URL if needed.
4. Configure email delivery for your intended users in Supabase. Email sign-in can be limited by your project's email provider settings and rate limits.
5. Add the same public settings in Vercel for the relevant deployment environment, then rebuild/redeploy. Next.js embeds `NEXT_PUBLIC_*` values at build time.
6. Open Watchlists, send a sign-in link, create a list, and use a company's star to choose which lists contain it. Reload and test from another browser to confirm persistence. Sign in as a second account to verify the first account's lists are not visible.

See [Supabase email-link authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless) and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Tests cover quote parsing and upstream failure, stable news IDs, deduplication, Indian-day filtering, sample exclusion, watchlist request authentication/ownership, and database RLS using an isolated PostgreSQL runtime. Provider responses and Supabase Auth are mocked in unit tests. Real email delivery, deployed persistence, and browser interaction still require a configured staging project and manual smoke test.

## Structure

- `src/components`: interactive UI and account state.
- `src/app/api`: public research endpoints and authenticated watchlist routes.
- `src/lib/providers`: external market/news retrieval.
- `src/lib/supabase`: browser session handling and server token verification.
- `src/db`: read-only catalogue and seed tooling; no production user-data persistence.
- `supabase/migrations`: watchlist schema, ownership policies, and limits.
- `tests`: regression tests.

## Known limits

Free upstream endpoints can fail, throttle requests, or change. In-memory caches are per server instance and do not persist across restarts. News keyword classification remains approximate and Google News links may redirect to publishers. The stock catalogue does not currently distinguish every exchange listing; unsuffixed symbols use NSE quotes. MarketPulse is a research aid, not an exchange-authoritative data terminal.

MIT License — see [LICENSE](LICENSE).
