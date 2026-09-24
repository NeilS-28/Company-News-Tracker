import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatCurrency, formatPercent, formatPoints } from '../src/lib/utils';
import { getMarketQuote, quoteStatus } from '../src/lib/providers/market';

describe('Market Utilities & Quotes', () => {
  it('shows closed and delayed quotes without claiming they are live', () => {
    const now = Date.parse('2026-09-24T08:00:00Z');
    assert.strictEqual(quoteStatus({ marketState: 'CLOSED', exchangeDataDelayedBy: 0 }, now, now), 'closed');
    assert.strictEqual(quoteStatus({ marketState: 'REGULAR', exchangeDataDelayedBy: 15 }, now, now), 'delayed');
    assert.strictEqual(quoteStatus({ marketState: 'REGULAR' }, now, now), 'delayed');
    assert.strictEqual(quoteStatus({ marketState: 'REGULAR', exchangeDataDelayedBy: 0 }, now - 10 * 60_000, now), 'delayed');
    assert.strictEqual(quoteStatus({ marketState: 'REGULAR', exchangeDataDelayedBy: 0 }, now - 60_000, now), 'live');
  });
  it('formats currency in Indian Rupees format (INR / ₹)', () => {
    const formatted = formatCurrency(2500.5);
    assert.ok(formatted.includes('₹'));
    assert.ok(formatted.includes('2,500.50'));
  });

  it('formats percent changes accurately', () => {
    assert.strictEqual(formatPercent(2.5), '+2.50%');
    assert.strictEqual(formatPercent(-1.2), '-1.20%');
    assert.strictEqual(formatPercent(0), '0.00%');
  });

  it('formats index points accurately', () => {
    assert.strictEqual(formatPoints(24500.75), '24,500.75');
  });

  it('uses the provider trade time instead of the fetch time', async () => {
    const originalFetch = globalThis.fetch;
    const tradeTime = Math.floor(Date.parse('2026-09-24T08:00:00Z') / 1000);
    globalThis.fetch = async () => new Response(JSON.stringify({ chart: { result: [{ meta: {
      regularMarketPrice: 2500, chartPreviousClose: 2490, regularMarketTime: tradeTime,
      marketState: 'CLOSED', exchangeDataDelayedBy: 0,
    } }] } }), { status: 200 });
    try {
      const quote = await getMarketQuote('RELIANCE');
      assert.ok(quote);
      assert.strictEqual(quote.timestamp, new Date(tradeTime * 1000).toISOString());
      assert.strictEqual(quote.status, 'closed');
      assert.strictEqual(quote.symbol, 'RELIANCE');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

it('never contains fabricated baseline quote data', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile('src/lib/providers/market.ts', 'utf8');
  assert.ok(!source.includes('BASELINE_DATA'));
  assert.ok(!source.includes("status: 'baseline'"));
});
