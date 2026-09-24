import { MarketQuote } from '@/types';

const cache: Record<string, { quote: MarketQuote | null; expiresAt: number }> = {};
const CACHE_TTL_MS = 60_000;

export function quoteStatus(meta: { marketState?: string; exchangeDataDelayedBy?: number },
  marketTime: number, now = Date.now()): MarketQuote['status'] {
  if (meta.marketState === 'CLOSED' || meta.marketState === 'PRE' || meta.marketState === 'POST') return 'closed';
  // "Live" requires an explicit zero-delay claim from the provider and a recent trade.
  if (meta.marketState === 'REGULAR' && meta.exchangeDataDelayedBy === 0 &&
      marketTime <= now && now - marketTime <= 5 * 60_000) return 'live';
  return 'delayed';
}

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
      const marketTime = Number(meta?.regularMarketTime) * 1000;
      if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0 &&
          Number.isFinite(marketTime) && marketTime > 0) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = Number((price - prevClose).toFixed(2));
        const quote: MarketQuote = {
          symbol: cleanSymbol, name: meta.shortName || cleanSymbol, price, change,
          changePercent: prevClose ? Number(((change / prevClose) * 100).toFixed(2)) : 0,
          previousClose: prevClose, open: meta.regularMarketOpen || price,
          dayHigh: meta.regularMarketDayHigh || price, dayLow: meta.regularMarketDayLow || price,
          volume: meta.regularMarketVolume || 0, timestamp: new Date(marketTime).toISOString(),
          status: quoteStatus(meta, marketTime), source: 'Yahoo Finance',
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
  return { indices: await Promise.all(indices.map(symbol => getMarketQuote(symbol))), updatedAt: new Date().toISOString() };
}
