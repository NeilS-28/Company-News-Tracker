import { MarketQuote } from '@/types';

// Baseline reference prices for NIFTY 50 & Major Indices
const BASELINE_DATA: Record<string, { name: string; price: number; change: number; changePercent: number }> = {
  '^NSEI': { name: 'NIFTY 50', price: 25350.25, change: 125.40, changePercent: 0.50 },
  '^BSESN': { name: 'SENSEX', price: 82890.90, change: 395.20, changePercent: 0.48 },
  '^NSEBANK': { name: 'NIFTY Bank', price: 51920.15, change: -85.30, changePercent: -0.16 },
  'RELIANCE': { name: 'Reliance Industries', price: 3012.45, change: 24.15, changePercent: 0.81 },
  'TCS': { name: 'Tata Consultancy Services', price: 4320.10, change: 42.50, changePercent: 0.99 },
  'HDFCBANK': { name: 'HDFC Bank', price: 1682.30, change: 11.20, changePercent: 0.67 },
  'INFY': { name: 'Infosys', price: 1945.60, change: -14.80, changePercent: -0.76 },
  'ICICIBANK': { name: 'ICICI Bank', price: 1240.75, change: 8.90, changePercent: 0.72 },
  'BHARTIARTL': { name: 'Bharti Airtel', price: 1560.20, change: 18.40, changePercent: 1.19 },
  'SBIN': { name: 'State Bank of India', price: 815.40, change: -3.60, changePercent: -0.44 },
  'LICI': { name: 'LIC India', price: 1045.00, change: 12.00, changePercent: 1.16 },
  'ITC': { name: 'ITC Ltd', price: 512.30, change: 2.10, changePercent: 0.41 },
  'HINDUNILVR': { name: 'Hindustan Unilever', price: 2795.50, change: -8.50, changePercent: -0.30 },
  'LT': { name: 'Larsen & Toubro', price: 3680.00, change: 35.00, changePercent: 0.96 },
  'BAJFINANCE': { name: 'Bajaj Finance', price: 7420.00, change: 85.00, changePercent: 1.16 },
  'HCLTECH': { name: 'HCL Technologies', price: 1795.00, change: 15.50, changePercent: 0.87 },
  'MARUTI': { name: 'Maruti Suzuki India', price: 12450.00, change: 110.00, changePercent: 0.89 },
  'SUNPHARMA': { name: 'Sun Pharma', price: 1890.00, change: 22.00, changePercent: 1.18 },
  'TATAMOTORS': { name: 'Tata Motors', price: 980.50, change: -12.30, changePercent: -1.24 },
  'KOTAKBANK': { name: 'Kotak Mahindra Bank', price: 1845.00, change: 5.50, changePercent: 0.30 },
  'TITAN': { name: 'Titan Company', price: 3760.00, change: 48.00, changePercent: 1.29 },
  'ONGC': { name: 'ONGC', price: 318.40, change: 4.20, changePercent: 1.34 },
  'ADANIENT': { name: 'Adani Enterprises', price: 3045.00, change: -22.00, changePercent: -0.72 },
  'NTPC': { name: 'NTPC', price: 412.50, change: 3.10, changePercent: 0.76 },
  'AXISBANK': { name: 'Axis Bank', price: 1230.00, change: 7.50, changePercent: 0.61 },
  'POWERGRID': { name: 'Power Grid Corp', price: 340.20, change: 2.80, changePercent: 0.83 },
  'WIPRO': { name: 'Wipro', price: 545.00, change: 6.20, changePercent: 1.15 },
  'COALINDIA': { name: 'Coal India', price: 512.00, change: -2.50, changePercent: -0.49 },
  'BAJAJFINSV': { name: 'Bajaj Finserv', price: 1860.00, change: 16.00, changePercent: 0.87 },
  'ULTRACEMCO': { name: 'UltraTech Cement', price: 11400.00, change: 140.00, changePercent: 1.24 },
  'NESTLEIND': { name: 'Nestle India', price: 2520.00, change: -5.00, changePercent: -0.20 },
  'ASIANPAINT': { name: 'Asian Paints', price: 3240.00, change: -15.00, changePercent: -0.46 },
  'JSWSTEEL': { name: 'JSW Steel', price: 985.00, change: 11.00, changePercent: 1.13 },
  'GRASIM': { name: 'Grasim Industries', price: 2680.00, change: 18.00, changePercent: 0.68 },
  'TECHM': { name: 'Tech Mahindra', price: 1620.00, change: 25.00, changePercent: 1.57 },
  'M&M': { name: 'Mahindra & Mahindra', price: 2980.00, change: 38.00, changePercent: 1.29 },
  'TATASTEEL': { name: 'Tata Steel', price: 154.50, change: 1.80, changePercent: 1.18 },
  'ADANIPORTS': { name: 'Adani Ports & SEZ', price: 1450.00, change: 12.00, changePercent: 0.83 },
  'HINDALCO': { name: 'Hindalco Industries', price: 690.00, change: 8.50, changePercent: 1.25 },
  'CIPLA': { name: 'Cipla', price: 1640.00, change: 14.00, changePercent: 0.86 },
  'DRREDDY': { name: 'Dr. Reddy\'s Labs', price: 6850.00, change: 55.00, changePercent: 0.81 },
  'DIVISLAB': { name: 'Divi\'s Laboratories', price: 5420.00, change: 65.00, changePercent: 1.21 },
  'APOLLOHOSP': { name: 'Apollo Hospitals', price: 7100.00, change: 90.00, changePercent: 1.28 },
  'EICHERMOT': { name: 'Eicher Motors', price: 4950.00, change: 60.00, changePercent: 1.23 },
  'BPCL': { name: 'Bharat Petroleum', price: 360.00, change: 3.50, changePercent: 0.98 },
  'BRITANNIA': { name: 'Britannia Industries', price: 6020.00, change: 45.00, changePercent: 0.75 },
  'TATACONSUM': { name: 'Tata Consumer Products', price: 1210.00, change: 8.00, changePercent: 0.67 },
  'BAJAJ-AUTO': { name: 'Bajaj Auto', price: 11800.00, change: 150.00, changePercent: 1.29 },
  'HEROMOTOCO': { name: 'Hero MotoCorp', price: 5650.00, change: 40.00, changePercent: 0.71 },
  'INDUSINDBK': { name: 'IndusInd Bank', price: 1460.00, change: -12.00, changePercent: -0.82 },
  'BEL': { name: 'Bharat Electronics', price: 310.00, change: 5.50, changePercent: 1.81 },
  'TRENT': { name: 'Trent Ltd', price: 7250.00, change: 130.00, changePercent: 1.83 },
  'SHRIRAMFIN': { name: 'Shriram Finance', price: 3350.00, change: 42.00, changePercent: 1.27 },
  'SBILIFE': { name: 'SBI Life Insurance', price: 1820.00, change: 14.00, changePercent: 0.78 },
  'HDFCLIFE': { name: 'HDFC Life Insurance', price: 745.00, change: 6.00, changePercent: 0.81 },
};

// Simple cache with 60s TTL
const cache: Record<string, { quote: MarketQuote; expiresAt: number }> = {};
const CACHE_TTL_MS = 60 * 1000;

export async function getMarketQuote(symbol: string): Promise<MarketQuote> {
  const cleanSymbol = symbol.toUpperCase().replace('.NS', '');
  const cacheKey = cleanSymbol;

  const cached = cache[cacheKey];
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  // Format yahoo symbol (add .NS for Indian stocks if not index)
  const isIndex = cleanSymbol.startsWith('^');
  const yahooSymbol = isIndex ? cleanSymbol : `${cleanSymbol}.NS`;

  // 1. Check Finnhub API Key if configured
  if (process.env.FINNHUB_API_KEY && !isIndex) {
    try {
      const fhRes = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}.NS&token=${process.env.FINNHUB_API_KEY}`,
        { next: { revalidate: 60 } }
      );
      if (fhRes.ok) {
        const fhData = await fhRes.json();
        if (fhData && typeof fhData.c === 'number' && fhData.c > 0) {
          const price = fhData.c;
          const prevClose = fhData.pc || price;
          const change = Number((fhData.d ?? (price - prevClose)).toFixed(2));
          const changePercent = Number((fhData.dp ?? ((change / prevClose) * 100)).toFixed(2));

          const quote: MarketQuote = {
            symbol: cleanSymbol,
            name: BASELINE_DATA[cleanSymbol]?.name || cleanSymbol,
            price,
            change,
            changePercent,
            previousClose: prevClose,
            open: fhData.o || price,
            dayHigh: fhData.h || price,
            dayLow: fhData.l || price,
            volume: 0,
            timestamp: new Date().toISOString(),
            status: 'live',
            source: 'Finnhub',
          };

          cache[cacheKey] = { quote, expiresAt: Date.now() + CACHE_TTL_MS };
          return quote;
        }
      }
    } catch {
      // Fall through
    }
  }

  // 2. Real-time Yahoo Finance (Free, no key required)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
        next: { revalidate: 60 },
      }
    );

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && typeof meta.regularMarketPrice === 'number') {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = Number((price - prevClose).toFixed(2));
        const changePercent = Number(((change / prevClose) * 100).toFixed(2));

        const quote: MarketQuote = {
          symbol: cleanSymbol,
          name: meta.shortName || cleanSymbol,
          price,
          change,
          changePercent,
          previousClose: prevClose,
          open: meta.regularMarketDayHigh ? meta.regularMarketDayLow : price,
          dayHigh: meta.regularMarketDayHigh || price,
          dayLow: meta.regularMarketDayLow || price,
          volume: meta.regularMarketVolume || 0,
          timestamp: new Date().toISOString(),
          status: 'live',
          source: 'Yahoo Finance',
        };

        cache[cacheKey] = { quote, expiresAt: Date.now() + CACHE_TTL_MS };
        return quote;
      }
    }
  } catch {
    // Network or parse issue, fall through to fallback baseline
  }

  // Fallback to baseline (honest static reference — no simulated fluctuation)
  const base = BASELINE_DATA[cleanSymbol] || {
    name: cleanSymbol,
    price: 1500.0,
    change: 12.5,
    changePercent: 0.84,
  };

  const prevClose = base.price - base.change;

  const quote: MarketQuote = {
    symbol: cleanSymbol,
    name: base.name,
    price: base.price,
    change: base.change,
    changePercent: base.changePercent,
    previousClose: prevClose,
    open: prevClose + (base.change * 0.3),
    dayHigh: base.price + Math.abs(base.change * 0.8),
    dayLow: base.price - Math.abs(base.change * 0.8),
    volume: 0,
    timestamp: new Date().toISOString(),
    status: 'baseline',
    source: 'Baseline Ref',
  };

  cache[cacheKey] = { quote, expiresAt: Date.now() + CACHE_TTL_MS };
  return quote;
}

export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
  const results: Record<string, MarketQuote> = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        results[sym] = await getMarketQuote(sym);
      } catch {
        // Ignore single failures
      }
    })
  );
  return results;
}

export async function getMarketOverviewData() {
  const indices = ['^NSEI', '^BSESN', '^NSEBANK'];
  const quotes = await Promise.all(indices.map((sym) => getMarketQuote(sym)));

  return {
    indices: quotes,
    marketBreadth: {
      advances: 32,
      declines: 17,
      unchanged: 1,
      advanceDeclineRatio: 1.88,
    },
    updatedAt: new Date().toISOString(),
  };
}
