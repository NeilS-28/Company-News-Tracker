import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isCurrentDay, companyMatchesText } from '../src/lib/providers/news';
import { articleKey } from '../src/lib/news-store';

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

  it('uses the calendar day in India across UTC midnight', () => {
    const now = new Date('2026-09-24T19:00:00Z'); // 00:30 on 25 Sep in India
    assert.strictEqual(isCurrentDay('2026-09-24T18:45:00Z', now), true);
    assert.strictEqual(isCurrentDay('2026-09-24T17:45:00Z', now), false);
  });
});

it('does not rely on random IDs in the news provider', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile('src/lib/providers/news.ts', 'utf8');
  assert.ok(!source.includes('Math.random()'));
  assert.ok(source.includes('stableArticleId'));
});

it('keeps archived article keys stable and separates source types', () => {
  const url = 'https://example.org/filing/123';
  assert.equal(articleKey('news', url), articleKey('news', url));
  assert.notEqual(articleKey('news', url), articleKey('nse-filing', url));
});

it('does not tag a company just because its ticker appears as lowercase prose', () => {
  const company = { name: 'Example Idea Limited', shortName: 'Example Idea', ticker: 'IDEA' };
  assert.equal(companyMatchesText(company, 'A fresh idea for investors'), false);
  assert.equal(companyMatchesText(company, 'Example Idea announced results'), true);
  assert.equal(companyMatchesText(company, 'IDEA announced results'), true);
});
