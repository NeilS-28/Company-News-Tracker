import Parser from 'rss-parser';
import { articleId, isArticleUrl, deduplicateArticles } from '@/lib/news-quality';
import { DealRadarItem, DealStatus } from '@/types';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  timeout: 5000,
});

export function classifyDealStatus(title: string, summary: string): {
  status: DealStatus;
  dealType: 'mna' | 'stake-sale' | 'joint-venture' | 'expansion' | 'clarification' | 'other';
  confidence: 'speculative';
} {
  const text = `${title} ${summary}`.toLowerCase();

  // 2. Denied Rumours
  if (
    text.includes('denies') ||
    text.includes('refutes') ||
    text.includes('baseless') ||
    text.includes('rejects speculation') ||
    text.includes('no talks')
  ) {
    return {
      status: 'reported-denial',
      dealType: 'clarification',
      confidence: 'speculative',
    };
  }

  // 1. SEBI Exchange Clarifications
  if (
    text.includes('clarification on') ||
    text.includes('clarifies on') ||
    text.includes('exchange query') ||
    text.includes('media report clarification') ||
    text.includes('lodr')
  ) {
    return {
      status: 'reported-clarification',
      dealType: 'clarification',
      confidence: 'speculative',
    };
  }

  // 3. Confirmed / Signed Deals
  if (
    text.includes('signs pact') ||
    text.includes('signs agreement') ||
    text.includes('completes acquisition') ||
    text.includes('cci approves') ||
    text.includes('regulatory nod') ||
    text.includes('seals deal') ||
    text.includes('finalises buyout')
  ) {
    let dealType: 'mna' | 'stake-sale' | 'joint-venture' | 'expansion' | 'clarification' | 'other' = 'mna';
    if (text.includes('joint venture') || text.includes('jv')) dealType = 'joint-venture';
    else if (text.includes('stake')) dealType = 'stake-sale';
    return {
      status: 'reported-agreement',
      dealType,
      confidence: 'speculative',
    };
  }

  // 4. In Talks (Active discussions)
  if (
    text.includes('in talks') ||
    text.includes('in discussions') ||
    text.includes('eyes acquisition') ||
    text.includes('bidding for') ||
    text.includes('evaluating offer') ||
    text.includes('in advanced talks')
  ) {
    return {
      status: 'reported-talks',
      dealType: text.includes('jv') ? 'joint-venture' : text.includes('stake') ? 'stake-sale' : 'mna',
      confidence: 'speculative',
    };
  }

  // 5. Unverified Rumours & Deal Desk Scoops
  return {
    status: 'unverified-rumour',
    dealType: text.includes('stake') ? 'stake-sale' : text.includes('jv') ? 'joint-venture' : 'mna',
    confidence: 'speculative',
  };
}

// Live Deal Scanner Cache
const dealCache: Record<string, { items: DealRadarItem[]; expiresAt: number }> = {};
const CACHE_TTL = 3 * 60 * 1000;

export async function fetchLiveDealsAndRumours(companyQuery?: string): Promise<DealRadarItem[]> {
  const query = companyQuery
    ? `${companyQuery} (deal OR acquisition OR "in talks" OR merger OR stake OR "clarification on media")`
    : `(NIFTY OR "Tata" OR "Reliance" OR "Adani" OR "HDFC") (acquisition OR "in talks" OR merger OR "stake sale" OR "clarification on")`;

  const cacheKey = `deals:${companyQuery || 'global'}`;
  if (dealCache[cacheKey] && dealCache[cacheKey].expiresAt > Date.now()) {
    return dealCache[cacheKey].items;
  }

  try {
    const encoded = encodeURIComponent(query + ' India stock market');
    const feed = await parser.parseURL(
      `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`
    );

    const items: DealRadarItem[] = (feed.items || []).filter(item => isArticleUrl(item.link || '') && Number.isFinite(Date.parse(item.isoDate || item.pubDate || ''))).slice(0, 30).map((item) => {
      const originalTitle = item.title || 'Corporate Deal Update';
      const separator = originalTitle.lastIndexOf(' - ');
      const title = separator < 0 ? originalTitle : originalTitle.slice(0, separator);
      const summary = (item.contentSnippet || title).replace(/<[^>]*>/g, '');
      const { status, dealType, confidence } = classifyDealStatus(title, summary);
      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

      return {
        id: articleId(item.link!),
        title,
        summary,
        source: separator < 0 ? item.creator || 'Financial News' : originalTitle.slice(separator + 3),
        sourceUrl: item.link || '#',
        publishedAt,
        imageUrl: null,
        sentiment: status === 'reported-denial' ? 'negative' : status === 'reported-agreement' ? 'positive' : 'neutral',
        category: 'deals-rumours',
        createdAt: publishedAt,
        dealStatus: status,
        dealType,
        sourceConfidence: confidence,
        companies: [],
        sectors: [],
      };
    });

    if (Object.keys(dealCache).length >= 200) delete dealCache[Object.keys(dealCache)[0]];
    dealCache[cacheKey] = { items: deduplicateArticles(items), expiresAt: Date.now() + CACHE_TTL };
    return dealCache[cacheKey].items;
  } catch {
    throw new Error('Deal news is temporarily unavailable. Please retry.');
  }
}
