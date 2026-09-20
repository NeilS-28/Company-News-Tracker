import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isCurrentDay } from '../src/lib/providers/news';

describe('News Provider Utilities', () => {
  it('correctly identifies today dates', () => {
    const today = new Date().toISOString();
    assert.strictEqual(isCurrentDay(today), true);
  });

  it('correctly rejects past dates', () => {
    const oldDate = new Date('2020-01-01T00:00:00.000Z').toISOString();
    assert.strictEqual(isCurrentDay(oldDate), false);
  });

  it('handles invalid date strings safely without throwing', () => {
    assert.strictEqual(isCurrentDay('invalid-date-string'), false);
  });
});

it('does not rely on random IDs in the news provider', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile('src/lib/providers/news.ts', 'utf8');
  assert.ok(!source.includes('Math.random()'));
  assert.ok(source.includes('stableArticleId'));
});
