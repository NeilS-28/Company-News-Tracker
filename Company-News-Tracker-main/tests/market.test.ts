import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatCurrency, formatPercent, formatPoints } from '../src/lib/utils';
import { getMarketQuote } from '../src/lib/providers/market';

describe('Market Utilities & Quotes', () => {
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

  it('returns valid market quote with baseline fallback and proper status tag', async () => {
    const quote = await getMarketQuote('RELIANCE');
    assert.ok(quote);
    assert.strictEqual(quote.symbol, 'RELIANCE');
    assert.strictEqual(typeof quote.price, 'number');
    assert.ok(quote.price > 0);
    assert.ok(['live', 'delayed', 'baseline'].includes(quote.status));
  });
});

it('never contains fabricated baseline quote data', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile('src/lib/providers/market.ts', 'utf8');
  assert.ok(!source.includes('BASELINE_DATA'));
  assert.ok(!source.includes("status: 'baseline'"));
});
