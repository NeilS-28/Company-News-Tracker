import { MarketQuote } from '@/types';

const cache: Record<string, { quote: MarketQuote | null; expiresAt: number }> = {};
const CACHE_TTL_MS = 60_000;

/** Fetches a real quote. Unavailable data is null; fabricated/reference prices are never returned. */
export async function getMarketQuote(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<MarketQuote | null> {
  const cleanSymbol = symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');
  const isIndex = cleanSymbol.startsWith('^');
  const yahooSymbol = isIndex ? cleanSymbol : `${cleanSymbol}.${exchange === 'BSE' ? 'BO' : 'NS'}`;
  const cacheKey = yahooSymbol;
  const cached = cache[cacheKey];
  if (cached && cached.expiresAt > Date.now()) return cached.quote;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal, next: { revalidate: 60 },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = Number((price - prevClose).toFixed(2));
        const quote: MarketQuote = {
          symbol: cleanSymbol, name: meta.shortName || cleanSymbol, price, change,
          changePercent: prevClose ? Number(((change / prevClose) * 100).toFixed(2)) : 0,
          previousClose: prevClose, open: meta.regularMarketOpen || price,
          dayHigh: meta.regularMarketDayHigh || price, dayLow: meta.regularMarketDayLow || price,
          volume: meta.regularMarketVolume || 0, timestamp: new Date().toISOString(), status: 'live', source: 'Yahoo Finance',
        };
        cache[cacheKey] = { quote, expiresAt: Date.now() + CACHE_TTL_MS };
        return quote;
      }
    }
  } catch { /* unavailable */ }
  cache[cacheKey] = { quote: null, expiresAt: Date.now() + 15_000 };
  return null;
}

export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, MarketQuote | null>> {
  const entries = await Promise.all(symbols.map(async s => [s, await getMarketQuote(s)] as const));
  return Object.fromEntries(entries);
}

export async function getMarketOverviewData() {
  const indices = ['^NSEI', '^BSESN', '^NSEBANK'];
  return { indices: await Promise.all(indices.map(getMarketQuote)), updatedAt: new Date().toISOString() };
}
