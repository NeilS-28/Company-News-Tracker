import test from 'node:test';
import assert from 'node:assert/strict';
import Parser from 'rss-parser';
import {
  articleId,
  deduplicateArticles,
  classifySentiment,
  isCurrentDay,
} from '../src/lib/news-quality';
import { classifyDealStatus } from '../src/lib/providers/deals';
import { getAggregatedNews } from '../src/lib/providers/news';

test('canonical URLs produce stable IDs across tracking parameters', () => {
  assert.equal(
    articleId('https://example.com/article?utm_source=feed#top'),
    articleId('https://example.com/article'),
  );
});
test('deduplication preserves distinct headlines with the same prefix', () => {
  const articles = [
    {
      id: '1',
      source: 'A',
      title: 'HDFC Bank latest quarterly earnings beat estimates',
    },
    {
      id: '2',
      source: 'A',
      title: 'HDFC Bank latest quarterly earnings miss estimates',
    },
  ];
  assert.equal(deduplicateArticles([...articles, articles[0]]).length, 2);
});
test('profit falls is negative; mixed and negated headlines are neutral', () => {
  assert.equal(classifySentiment('HDFC Bank profit falls 10%'), 'negative');
  assert.equal(classifySentiment('Profit rises but revenue falls'), 'neutral');
  assert.equal(classifySentiment('Company denies loss warning'), 'neutral');
});
test('today uses the Indian calendar and excludes yesterday and future timestamps', () => {
  const now = new Date('2026-09-19T00:30:00Z');
  assert.equal(isCurrentDay('2026-09-18T19:00:00Z', now), true);
  assert.equal(isCurrentDay('2026-09-18T18:00:00Z', now), false);
  assert.equal(isCurrentDay('2026-09-19T02:00:00Z', now), false);
});
test('denials take precedence and no headline classification claims verified confidence', () => {
  assert.equal(
    classifyDealStatus(
      'Company denies acquisition; clarification on media reports',
      '',
    ).status,
    'reported-denial',
  );
  assert.equal(
    classifyDealStatus('Company signs pact', '').confidence,
    'speculative',
  );
});
test('empty upstream feed never returns seeded articles', async (t) => {
  t.mock.method(Parser.prototype, 'parseURL', async () => ({ items: [] }));
  const result = await getAggregatedNews({ forceRefresh: true });
  assert.deepEqual(result.articles, []);
});
test('duplicate RSS items are collapsed; malformed source URLs are excluded', async (t) => {
  const item = {
    title: 'Profit falls - Publisher',
    link: 'https://example.com/news/falls',
    isoDate: '2026-09-18T10:00:00Z',
  };
  t.mock.method(Parser.prototype, 'parseURL', async () => ({
    items: [item, item, { ...item, link: 'javascript:alert(1)' }],
  }));
  const first = await getAggregatedNews({ forceRefresh: true });
  const second = await getAggregatedNews({ forceRefresh: true });
  assert.equal(first.total, 1);
  assert.equal(first.articles[0].id, second.articles[0].id);
  assert.equal(first.articles[0].source, 'Publisher');
});
test('upstream outage is an error, not a successful empty feed', async (t) => {
  t.mock.method(Parser.prototype, 'parseURL', async () => {
    throw new Error('Network unavailable');
  });
  await assert.rejects(
    getAggregatedNews({ forceRefresh: true }),
    /temporarily unavailable/,
  );
});
