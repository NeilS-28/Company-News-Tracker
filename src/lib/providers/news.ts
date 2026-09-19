import { articleId, isArticleUrl, deduplicateArticles, classifySentiment, isCurrentDay } from '@/lib/news-quality';
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

function classifyCategory(title: string): NewsCategory {
  const titleLower = title.toLowerCase();
  if (/\b(results?|q[1-4]|quarter(?:ly)?|earnings|revenue|ebitda|profits?|loss(?:es)?|pat)\b/i.test(titleLower)) {
    return 'results';
  } else if (/\b(ceo|cfo|appoint\w*|resign\w*|md|directors?|leadership|board|chairman)\b/i.test(titleLower)) {
    return 'management';
  } else if (/dividend|split|bonus|buyback|rights issue|allotment/i.test(titleLower)) {
    return 'corporate-actions';
  } else if (/acquire|merger|stake|deal|m&a|takeover|joint venture|partnership|investment/i.test(titleLower)) {
    return 'mna';
  } else if (/sebi|rbi|tax|court|cci|tribunal|penalty|notice|enforcement|regulatory/i.test(titleLower)) {
    return 'regulation';
  } else if (/target|brokerage|rating|recommend|upgrade|downgrade|clsa|nomura|morgan|jefferies|goldman/i.test(titleLower)) {
    return 'analyst';
  }
  return 'company';
}

// Helper to tag company & sector entities from title/snippet
function tagEntities(
  title: string,
  summary: string,
  explicitCompanyId?: number,
  explicitSectorId?: number
): { companies: { id: number; name: string; ticker: string; slug: string }[]; sectors: { id: number; name: string; slug: string }[] } {
  const allCompanies = db.getCompanies();
  const allSectors = db.getSectors();
  const text = `${title} ${summary}`.toLowerCase();

  const matchedCompanies: { id: number; name: string; ticker: string; slug: string }[] = [];
  const matchedSectors: { id: number; name: string; slug: string }[] = [];

  if (explicitCompanyId) {
    const comp = allCompanies.find(c => c.id === explicitCompanyId);
    if (comp) matchedCompanies.push({ id: comp.id, name: comp.name, ticker: comp.ticker, slug: comp.slug });
  } else {
    for (const comp of allCompanies) {
      const ticker = comp.ticker.toLowerCase();
      const shortName = comp.shortName.toLowerCase();
      const name = comp.name.toLowerCase();
      
      // Match ticker as word boundary or recognizable short name
      const tickerRegex = new RegExp(`\\b${ticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (
        (shortName.length > 2 && text.includes(shortName)) ||
        (name.length > 3 && text.includes(name)) ||
        tickerRegex.test(text)
      ) {
        matchedCompanies.push({ id: comp.id, name: comp.name, ticker: comp.ticker, slug: comp.slug });
        if (matchedCompanies.length >= 3) break;
      }
    }
  }

  if (explicitSectorId) {
    const sec = allSectors.find(s => s.id === explicitSectorId);
    if (sec) matchedSectors.push({ id: sec.id, name: sec.name, slug: sec.slug });
  } else {
    for (const sec of allSectors) {
      const secName = sec.name.toLowerCase();
      if (text.includes(secName) || (sec.slug && text.includes(sec.slug))) {
        matchedSectors.push({ id: sec.id, name: sec.name, slug: sec.slug });
        if (matchedSectors.length >= 2) break;
      }
    }
  }

  return { companies: matchedCompanies, sectors: matchedSectors };
}

// NewsAPI.org fetcher (if NEWS_API_KEY is configured)
async function fetchNewsApiKey(query: string, companyId?: number): Promise<NewsArticleWithRelations[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query + ' India stock')}&sortBy=publishedAt&pageSize=15&apiKey=${apiKey}`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.filter((item: { url?: string; publishedAt?: string }) => isArticleUrl(item.url || '') && Number.isFinite(Date.parse(item.publishedAt || ''))).map((item: { title?: string; description?: string; source?: { name?: string }; url: string; publishedAt: string; urlToImage?: string; image?: string }) => {
      const { companies, sectors } = tagEntities(item.title || '', item.description || '', companyId);
      return {
        id: articleId(item.url),
        title: item.title || 'Market Update',
        summary: item.description || item.title || '',
        source: item.source?.name || 'Financial News',
        sourceUrl: item.url || '#',
        publishedAt: item.publishedAt || new Date().toISOString(),
        imageUrl: item.urlToImage || null,
        sentiment: classifySentiment(item.title || ''),
        category: classifyCategory(item.title || ''),
        createdAt: item.publishedAt || new Date().toISOString(),
        companies,
        sectors,
      };
    });
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
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query + ' stock India')}&lang=en&country=in&max=15&apikey=${apiKey}`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.filter((item: { url?: string; publishedAt?: string }) => isArticleUrl(item.url || '') && Number.isFinite(Date.parse(item.publishedAt || ''))).map((item: { title?: string; description?: string; source?: { name?: string }; url: string; publishedAt: string; urlToImage?: string; image?: string }) => {
      const { companies, sectors } = tagEntities(item.title || '', item.description || '', companyId);
      return {
        id: articleId(item.url),
        title: item.title || 'Market Update',
        summary: item.description || item.title || '',
        source: item.source?.name || 'GNews Feed',
        sourceUrl: item.url || '#',
        publishedAt: item.publishedAt || new Date().toISOString(),
        imageUrl: item.image || null,
        sentiment: classifySentiment(item.title || ''),
        category: classifyCategory(item.title || ''),
        createdAt: item.publishedAt || new Date().toISOString(),
        companies,
        sectors,
      };
    });
  } catch {
    return [];
  }
}

// Free Google News RSS fallback (always available without API keys)
export async function fetchGoogleNewsRss(
  query: string,
  companyId?: number,
  sectorId?: number,
  forceRefresh = false,
  todayOnly = false
): Promise<NewsArticleWithRelations[]> {
  const finalQuery = todayOnly ? `${query} when:1d` : query;
  const cacheKey = `rss:${finalQuery}:${companyId || 0}:${sectorId || 0}`;
  if (!forceRefresh && newsCache[cacheKey] && newsCache[cacheKey].expiresAt > Date.now()) {
    return newsCache[cacheKey].items;
  }

  try {
    const encodedQuery = encodeURIComponent(finalQuery);
    const feed = await parser.parseURL(
      `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`
    );

    const items: NewsArticleWithRelations[] = (feed.items || []).filter(item => isArticleUrl(item.link || '') && Number.isFinite(Date.parse(item.isoDate || item.pubDate || ''))).slice(0, 100).map((item) => {
      const lastDash = (item.title || '').lastIndexOf(' - ');
      let title = item.title || 'Market Update';
      let source = item.creator || 'Financial News';
      if (lastDash !== -1) {
        title = (item.title || '').substring(0, lastDash).trim();
        source = (item.title || '').substring(lastDash + 3).trim();
      }

      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
      const summary = (item.contentSnippet || title).replace(/<[^>]*>/g, '');
      const { companies, sectors } = tagEntities(title, summary, companyId, sectorId);

      return {
        id: articleId(item.link!),
        title,
        summary,
        source,
        sourceUrl: item.link || '#',
        publishedAt,
        imageUrl: null,
        sentiment: classifySentiment(title),
        category: classifyCategory(title),
        createdAt: publishedAt,
        companies,
        sectors,
      };
    });

    if (Object.keys(newsCache).length >= 200) delete newsCache[Object.keys(newsCache)[0]];
    newsCache[cacheKey] = { items, expiresAt: Date.now() + CACHE_TTL };
    return items;
  } catch (err) {
    console.error('RSS fetch failed', err instanceof Error ? err.message : 'Unknown error');
    throw new Error('News source is temporarily unavailable. Please retry.');
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
  forceRefresh?: boolean;
  todayOnly?: boolean;
}

export async function getAggregatedNews(options: GetNewsOptions = {}): Promise<{
  articles: NewsArticleWithRelations[];
  total: number;
  lastUpdated: string;
}> {
  const {
    companyId,
    sectorId,
    category,
    sentiment,
    search,
    limit = 20,
    offset = 0,
    forceRefresh = false,
    todayOnly = false,
  } = options;

  let liveItems: NewsArticleWithRelations[] = [];

  // Determine appropriate live query
  if (companyId) {
    const company = db.getCompanyById(companyId);
    if (company) {
      const q = company.shortName || company.name;
      if (process.env.NEWS_API_KEY) {
        liveItems = await fetchNewsApiKey(q, companyId);
      } else if (process.env.GNEWS_API_KEY) {
        liveItems = await fetchGNewsKey(q, companyId);
      }
      if (liveItems.length === 0) {
        liveItems = await fetchGoogleNewsRss(`${q} stock market India`, companyId, undefined, forceRefresh, todayOnly);
      }
    }
  } else if (sectorId) {
    const sector = db.getSectors().find(s => s.id === sectorId);
    const sectorQuery = sector ? `${sector.name} stocks India market` : 'India stock market';
    liveItems = await fetchGoogleNewsRss(sectorQuery, undefined, sectorId, forceRefresh, todayOnly);
  } else {
    // General market feed or category-specific live news
    let marketQuery = 'Indian stock market business news Sensex Nifty BSE NSE';
    if (category && category !== 'all') {
      if (category === 'results') marketQuery = 'India corporate quarterly results earnings profit Q1 Q2 Q3 Q4';
      else if (category === 'management') marketQuery = 'India companies CEO CFO MD appointments resignation';
      else if (category === 'corporate-actions') marketQuery = 'India stocks dividend split bonus share buyback';
      else if (category === 'mna') marketQuery = 'India corporate merger acquisition takeover deal';
      else if (category === 'regulation') marketQuery = 'SEBI RBI penalty regulatory order stock market India';
      else if (category === 'analyst') marketQuery = 'stock target price rating upgrade brokerage India';
    }
    liveItems = await fetchGoogleNewsRss(marketQuery, undefined, undefined, forceRefresh, todayOnly);
  }

  let articles = deduplicateArticles(liveItems);
  if (category && category !== 'all') articles = articles.filter(item => item.category === category);
  if (sentiment) articles = articles.filter(item => item.sentiment === sentiment);
  if (search?.trim()) {
    const query = search.trim().toLowerCase();
    articles = articles.filter(item => `${item.title} ${item.summary}`.toLowerCase().includes(query));
  }
  if (todayOnly) articles = articles.filter(item => isCurrentDay(item.publishedAt));
  articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return { articles: articles.slice(offset, offset + limit), total: articles.length, lastUpdated: new Date().toISOString() };
}
