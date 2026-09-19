import { MarketQuote } from '@/types';

const cache = new Map<
  string,
  { quote: MarketQuote | null; expiresAt: number }
>();
const TTL = 60_000;
const MAX_STALE = 24 * 60 * 60 * 1000;
const numeric = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
const positive = (value: unknown): number | null => {
  const n = numeric(value);
  return n !== null && n > 0 ? n : null;
};

// Provider timestamps describe the quote; fetchedAt describes this application's request.
export function parseYahooQuote(
  symbol: string,
  data: unknown,
): MarketQuote | null {
  const result = (
    data as {
      chart?: {
        result?: Array<{
          meta?: Record<string, unknown>;
          indicators?: { quote?: Array<{ open?: unknown[] }> };
        }>;
      };
    }
  )?.chart?.result?.[0];
  const meta = result?.meta;
  const price = positive(meta?.regularMarketPrice);
  const time = positive(meta?.regularMarketTime);
  if (
    price === null ||
    time === null ||
    !Number.isFinite(new Date(time * 1000).getTime())
  )
    return null;
  const previousClose =
    positive(meta?.chartPreviousClose) ?? positive(meta?.previousClose);
  const change =
    previousClose === null ? null : Number((price - previousClose).toFixed(2));
  return {
    symbol,
    name: typeof meta?.shortName === 'string' ? meta.shortName : symbol,
    price,
    previousClose,
    change,
    changePercent:
      change === null || previousClose === null
        ? null
        : Number(((change / previousClose) * 100).toFixed(2)),
    open: positive(
      result?.indicators?.quote?.[0]?.open?.find((v) => positive(v) !== null),
    ),
    dayHigh: positive(meta?.regularMarketDayHigh),
    dayLow: positive(meta?.regularMarketDayLow),
    volume: numeric(meta?.regularMarketVolume),
    timestamp: new Date(time * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    source: 'Yahoo Finance',
    status: 'provider',
  };
}

export async function getMarketQuote(
  symbol: string,
): Promise<MarketQuote | null> {
  const cleanSymbol = symbol.toUpperCase().replace(/\.(NS|BO)$/, '');
  const cached = cache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) return cached.quote;
  let quote: MarketQuote | null = null;
  if (
    process.env.FINNHUB_API_KEY &&
    !cleanSymbol.startsWith('^') &&
    !symbol.endsWith('.BO')
  ) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(cleanSymbol + '.NS')}&token=${process.env.FINNHUB_API_KEY}`,
        { cache: 'no-store', signal: AbortSignal.timeout(3000) },
      );
      const data = res.ok ? await res.json() : null;
      if (positive(data?.c) && positive(data?.t)) {
        quote = {
          symbol: cleanSymbol,
          name: cleanSymbol,
          price: data.c,
          change: numeric(data.d),
          changePercent: numeric(data.dp),
          previousClose: positive(data.pc),
          open: positive(data.o),
          dayHigh: positive(data.h),
          dayLow: positive(data.l),
          volume: null,
          timestamp: new Date(data.t * 1000).toISOString(),
          fetchedAt: new Date().toISOString(),
          source: 'Finnhub',
          status: 'provider',
        };
      }
    } catch {
      /* Try the other provider. */
    }
  }
  if (!quote) {
    try {
      const yahooSymbol = cleanSymbol.startsWith('^')
        ? cleanSymbol
        : /\.(NS|BO)$/.test(symbol)
          ? symbol
          : `${cleanSymbol}.NS`;
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
        {
          headers: { 'User-Agent': 'MarketPulse/1.0' },
          cache: 'no-store',
          signal: AbortSignal.timeout(3000),
        },
      );
      if (res.ok) quote = parseYahooQuote(cleanSymbol, await res.json());
    } catch {
      /* Never substitute generated data. */
    }
  }
  if (
    !quote &&
    cached?.quote &&
    Date.now() - Date.parse(cached.quote.fetchedAt) <= MAX_STALE
  ) {
    quote = { ...cached.quote, status: 'stale' };
  }
  if (cache.size >= 500) cache.delete(cache.keys().next().value!);
  cache.set(symbol, { quote, expiresAt: Date.now() + TTL });
  return quote;
}

export async function getMultipleQuotes(
  symbols: string[],
): Promise<Record<string, MarketQuote | null>> {
  return Object.fromEntries(
    await Promise.all(
      symbols.map(async (symbol) => [symbol, await getMarketQuote(symbol)]),
    ),
  );
}

export async function getMarketOverviewData() {
  const indices = await Promise.all(
    ['^NSEI', '^BSESN', '^NSEBANK'].map(getMarketQuote),
  );
  return { indices, marketBreadth: null, updatedAt: new Date().toISOString() };
}
