import test from 'node:test';
import assert from 'node:assert/strict';
import { getMarketQuote, parseYahooQuote } from '../src/lib/providers/market';

const fixture = {
  chart: {
    result: [
      {
        meta: {
          shortName: 'Example',
          regularMarketPrice: 120,
          regularMarketTime: 1789731000,
          chartPreviousClose: 100,
          regularMarketDayHigh: 130,
          regularMarketDayLow: 105,
          regularMarketVolume: 900,
        },
        indicators: { quote: [{ open: [110] }] },
      },
    ],
  },
};
test('opening price comes from the OHLC series, not the daily low', () => {
  const quote = parseYahooQuote('EXAMPLE', fixture)!;
  assert.equal(quote.open, 110);
  assert.equal(quote.dayLow, 105);
  assert.equal(quote.changePercent, 20);
  assert.equal(quote.timestamp, new Date(1789731000 * 1000).toISOString());
  assert.equal(quote.source, 'Yahoo Finance');
});
test('missing fields stay unavailable rather than fabricating values', () => {
  const quote = parseYahooQuote('EXAMPLE', {
    chart: {
      result: [
        { meta: { regularMarketPrice: 120, regularMarketTime: 1789731000 } },
      ],
    },
  })!;
  assert.equal(quote.open, null);
  assert.equal(quote.volume, null);
  assert.equal(quote.change, null);
  assert.equal(parseYahooQuote('EXAMPLE', {}), null);
});
test('total upstream failure returns null even for an unknown stock', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Offline');
  });
  assert.equal(await getMarketQuote('UNKNOWN-TEST'), null);
});
test('cached fallback preserves original timestamps and is marked stale', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(fixture));
  const original = await getMarketQuote('CACHE-TEST');
  assert.ok(original);
  const now = Date.now();
  t.mock.method(Date, 'now', () => now + 61_000);
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Offline');
  });
  const fallback = await getMarketQuote('CACHE-TEST');
  assert.equal(fallback?.status, 'stale');
  assert.equal(fallback?.price, original.price);
  assert.equal(fallback?.timestamp, original.timestamp);
  assert.equal(fallback?.fetchedAt, original.fetchedAt);
});
