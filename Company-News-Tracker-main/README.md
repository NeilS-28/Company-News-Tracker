# MarketPulse — Indian Stock Market News & NIFTY 50 Research

**MarketPulse** is a modern, high-performance financial intelligence web application tracking Indian stock market news, NIFTY 50 constituents, sector trends, corporate disclosures, and an investigative **Deal Radar & Market Rumours Tracker**.

Live Demo: [https://company-news-tracker.vercel.app](https://company-news-tracker.vercel.app)

---

## Key Features

* **Real-Time Market Overview:** Live tracking of NIFTY 50, SENSEX, and NIFTY Bank with 1D point changes, percentage shifts, market breadth ratio (Advances vs. Declines), and top movers.
* **Deal Radar & Rumour Scanner:** Dedicated intelligence stream tracking upcoming M&A deals, stake sales, buyout talks, and joint ventures with heuristic status tagging (🟡 *Unverified Rumour*, 🔵 *In Talks*, 🟣 *SEBI Clarification*, 🟢 *Confirmed Pacts*, 🔴 *Denied*).
* **SEBI LODR 30(11) Rumour Verification:** Tracks official regulatory filings submitted to the National Stock Exchange (NSE) where companies formally clarify or deny media reports.
* **All 50 NIFTY 50 Constituents:** Browse, search, and sort all official constituents by market performance, sector, or news volume.
* **Deep Company Research:** Detailed company profile pages featuring live quotes (Day High/Low, Volume, Previous Close), company-specific news streams, sector peers, and direct links to official Investor Relations portals.
* **Sectors & Industries:** 16 core macroeconomic sectors with constituent previews and sector-wide news aggregation.
* **Custom Watchlists:** Add/remove stocks to build a personalized, aggregated news stream.
* **Terminal Aesthetic:** Dark financial terminal theme with custom glassmorphism, glowing status badges, and light mode switch.

---

## Tech Stack

* **Framework:** [Next.js 15/16](https://nextjs.org) (App Router, Turbopack)
* **Language:** TypeScript
* **Styling:** Vanilla CSS with design system tokens & glassmorphism (No Tailwind)
* **Data Providers:**
  * Free Yahoo Finance endpoint + internal real-time simulator
  * Google News RSS for Indian financial media (Moneycontrol, Economic Times, LiveMint, NDTV Profit)
  * Optional API keys: NewsAPI, GNews, Finnhub, Alpha Vantage
* **Icons:** [lucide-react](https://lucide.dev)
* **Database:** Zero-dependency file database engine (`src/db/index.ts`)
* **Deployment:** [Vercel](https://vercel.com)

---

## Getting Started

### Prerequisites
* Node.js 18+
* npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/NeilS-28/Company-News-Tracker.git
   cd Company-News-Tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Seed the database (populates 50 NIFTY 50 companies, 16 sectors, and 67 curated news/deal records):
   ```bash
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables (Optional)

Copy `.env.example` to `.env.local` if you wish to configure optional third-party API keys:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEWS_API_KEY` | Optional NewsAPI.org key for global news aggregation |
| `GNEWS_API_KEY` | Optional GNews.io key for enhanced live news |
| `FINNHUB_API_KEY` | Optional Finnhub.io key for stock quotes |
| `ALPHA_VANTAGE_API_KEY` | Optional Alpha Vantage key for market data |

*(If left blank, the app runs with zero configuration using free public RSS and Yahoo Finance feeds.)*

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## Production persistence

Accounts and private watchlists should use Supabase in production. Run `supabase/migrations/001_marketpulse_persistence.sql` in the Supabase SQL editor, then set `AUTH_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel. The service-role key is server-only and must never use a `NEXT_PUBLIC_` prefix. Without Supabase variables, local development falls back to `data/db.json`.

## Equity coverage

`npm run equities:validate` verifies the checked-in NSE/BSE master. `npm run equities:refresh` refreshes from the official exchange sources and validates the result before it is accepted. Quotes are never fabricated: unavailable provider data is returned as `null`.
