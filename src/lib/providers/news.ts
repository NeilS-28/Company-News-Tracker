import Parser from 'rss-parser';
import { db } from '@/db';
import { NewsArticleWithRelations, NewsCategory } from '@/types';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  timeout: 5000,
});

// Cache for news queries to prevent excessive fetching
const newsCache: Record<string, { items: NewsArticleWithRelations[]; expiresAt: number }> = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function classifySentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const titleLower = title.toLowerCase();
  if (/surge|jump|gain|profit|rise|high|rally|bull|growth|record|soar|buy|upgrade/i.test(titleLower)) {
    return 'positive';
  } else if (/plunge|fall|drop|loss|decline|slump|bear|down|probe|fine|penalty|crash|sell|downgrade/i.test(titleLower)) {
    return 'negative';
  }
  return 'neutral';
}

function classifyCategory(title: string): NewsCategory {
  const titleLower = title.toLowerCase();
  if (/result|q1|q2|q3|q4|quarter|earnings|revenue|ebitda/i.test(titleLower)) {
    return 'results';
  } else if (/ceo|cfo|appoint|resign|md|director|leadership/i.test(titleLower)) {
    return 'management';
  } else if (/dividend|split|bonus|buyback/i.test(titleLower)) {
    return 'corporate-actions';
  } else if (/acquire|merger|stake|deal|m&a/i.test(titleLower)) {
    return 'mna';
  } else if (/sebi|rbi|tax|court|cci|tribunal|penalty/i.test(titleLower)) {
    return 'regulation';
  } else if (/target|brokerage|rating|recommend/i.test(titleLower)) {
    return 'analyst';
  }
  return 'company';
}

// NewsAPI.org fetcher (if NEWS_API_KEY is configured)
async function fetchNewsApiKey(query: string, companyId?: number): Promise<NewsArticleWithRelations[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query + ' India stock')}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`,
      { next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.map((item: any, index: number) => ({
      id: 200000 + index + Math.floor(Math.random() * 10000),
      title: item.title || 'Market Update',
      summary: item.description || item.title || '',
      source: item.source?.name || 'Financial News',
      sourceUrl: item.url || '#',
      publishedAt: item.publishedAt || new Date().toISOString(),
      imageUrl: item.urlToImage || null,
      sentiment: classifySentiment(item.title || ''),
      category: classifyCategory(item.title || ''),
      createdAt: item.publishedAt || new Date().toISOString(),
      companies: companyId ? [{ id: companyId, name: query, ticker: query, slug: query.toLowerCase() }] : [],
      sectors: [],
    }));
  } catch {
    return [];
  }
}

// GNews.io fetcher (if GNEWS_API_KEY is configured)
async function fetchGNewsKey(query: string, companyId?: number): Promise<NewsArticleWithRelations[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query + ' stock India')}&lang=en&country=in&max=10&apikey=${apiKey}`,
      { next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.map((item: any, index: number) => ({
      id: 300000 + index + Math.floor(Math.random() * 10000),
      title: item.title || 'Market Update',
      summary: item.description || item.title || '',
      source: item.source?.name || 'GNews Feed',
      sourceUrl: item.url || '#',
      publishedAt: item.publishedAt || new Date().toISOString(),
      imageUrl: item.image || null,
      sentiment: classifySentiment(item.title || ''),
      category: classifyCategory(item.title || ''),
      createdAt: item.publishedAt || new Date().toISOString(),
      companies: companyId ? [{ id: companyId, name: query, ticker: query, slug: query.toLowerCase() }] : [],
      sectors: [],
    }));
  } catch {
    return [];
  }
}

// Free Google News RSS fallback (always available without API keys)
export async function fetchGoogleNewsRss(query: string, companyId?: number, sectorId?: number): Promise<NewsArticleWithRelations[]> {
  const cacheKey = `rss:${query}`;
  if (newsCache[cacheKey] && newsCache[cacheKey].expiresAt > Date.now()) {
    return newsCache[cacheKey].items;
  }

  try {
    const encodedQuery = encodeURIComponent(`${query} stock market India`);
    const feed = await parser.parseURL(
      `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`
    );

    const items: NewsArticleWithRelations[] = (feed.items || []).slice(0, 10).map((item, index) => {
      const title = item.title || 'Market Update';
      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

      return {
        id: 100000 + index + Math.floor(Math.random() * 10000),
        title,
        summary: item.contentSnippet || item.content || title,
        source: item.creator || item.source?.['$']?.['url'] || 'Financial Media',
        sourceUrl: item.link || '#',
        publishedAt,
        imageUrl: null,
        sentiment: classifySentiment(title),
        category: classifyCategory(title),
        createdAt: publishedAt,
        companies: companyId ? [{ id: companyId, name: query, ticker: query, slug: query.toLowerCase() }] : [],
        sectors: sectorId ? [{ id: sectorId, name: 'Market', slug: 'market' }] : [],
      };
    });

    newsCache[cacheKey] = { items, expiresAt: Date.now() + CACHE_TTL };
    return items;
  } catch {
    return [];
  }
}

export interface GetNewsOptions {
  companyId?: number;
  sectorId?: number;
  category?: NewsCategory;
  sentiment?: 'positive' | 'negative' | 'neutral';
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getAggregatedNews(options: GetNewsOptions = {}): Promise<{
  articles: NewsArticleWithRelations[];
  total: number;
}> {
  const { companyId, sectorId, category, sentiment, search, limit = 20, offset = 0 } = options;

  let localArticles = db.getNewsArticlesWithRelations({
    companyId,
    sectorId,
    category: category === 'all' ? undefined : category,
    sentiment,
    search,
    limit: 100,
    offset: 0,
  }) as NewsArticleWithRelations[];

  // Live real-time external augmentation
  if (companyId) {
    const company = db.getCompanyById(companyId);
    if (company) {
      const q = company.shortName || company.name;
      let liveItems: NewsArticleWithRelations[] = [];

      // Try API keys first if user configured them
      if (process.env.NEWS_API_KEY) {
        liveItems = await fetchNewsApiKey(q, companyId);
      } else if (process.env.GNEWS_API_KEY) {
        liveItems = await fetchGNewsKey(q, companyId);
      }

      // If no API key or empty response, use Google News RSS
      if (liveItems.length === 0) {
        liveItems = await fetchGoogleNewsRss(q, companyId);
      }

      if (liveItems.length > 0) {
        const titles = new Set(localArticles.map(a => a.title.toLowerCase().slice(0, 40)));
        const newItems = liveItems.filter(item => !titles.has(item.title.toLowerCase().slice(0, 40)));
        localArticles = [...newItems, ...localArticles];
      }
    }
  }

  // Sort by publishedAt desc
  localArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const total = localArticles.length;
  const paginated = localArticles.slice(offset, offset + limit);

  return {
    articles: paginated,
    total,
  };
}
