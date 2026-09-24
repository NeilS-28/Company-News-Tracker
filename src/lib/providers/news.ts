import Parser from 'rss-parser';
import crypto from 'crypto';
import { db } from '@/db';
import { NewsArticleWithRelations, NewsCategory } from '@/types';

// Typed interfaces for external API responses
interface NewsApiArticle {
  title?: string;
  description?: string;
  source?: { name?: string };
  url?: string;
  publishedAt?: string;
  urlToImage?: string | null;
}

interface GNewsArticle {
  title?: string;
  description?: string;
  source?: { name?: string };
  url?: string;
  publishedAt?: string;
  image?: string | null;
}

interface RssFeedItem {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  creator?: string;
  source?: { _?: string };
}

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
  if (/surge|jump|gain|profit|rise|high|rally|bull|growth|record|soar|buy|upgrade|dividend|expansion|beat|outperform|boost/i.test(titleLower)) {
    return 'positive';
  } else if (/plunge|fall|drop|loss|decline|slump|bear|down|probe|fine|penalty|crash|sell|downgrade|scam|fraud|warning|cautious/i.test(titleLower)) {
    return 'negative';
  }
  return 'neutral';
}

function classifyCategory(title: string): NewsCategory {
  const titleLower = title.toLowerCase();
  if (/result|q1|q2|q3|q4|quarter|earnings|revenue|ebitda|profit|loss|pat/i.test(titleLower)) {
    return 'results';
  } else if (/ceo|cfo|appoint|resign|md|director|leadership|board|chairman/i.test(titleLower)) {
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

function stableArticleId(url: string, title: string): number {
  const digest = crypto.createHash('sha256').update(`${url}|${title}`).digest();
  return 100000 + (digest.readUInt32BE(0) % 1900000000);
}

function normalizeEntityText(value: string): string {
  return value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function companyMatchesText(company: { name: string; shortName: string; ticker: string }, rawText: string): boolean {
  const text = ` ${normalizeEntityText(rawText)} `;
  const aliases = [company.name, company.shortName]
    .map(normalizeEntityText)
    .map(v => v.replace(/\b(limited|ltd|india|industries|corporation|corp|company|co)\b/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(v => v.length >= 4);
  const ticker = normalizeEntityText(company.ticker);
  return aliases.some(a => text.includes(` ${a} `)) || (ticker.length >= 3 && text.includes(` ${ticker} `));
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
    if (comp && companyMatchesText(comp, `${title} ${summary}`)) matchedCompanies.push({ id: comp.id, name: comp.name, ticker: comp.ticker, slug: comp.slug });
  } else {
    for (const comp of allCompanies) {
      const ticker = comp.ticker.toLowerCase();
      // Match ticker as word boundary or recognizable short name
      const tickerRegex = new RegExp(`\\b${ticker}\\b`, 'i');
      if (
        companyMatchesText(comp, text) || tickerRegex.test(text)
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
      { next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.filter((item: NewsApiArticle) => item.publishedAt && !isNaN(Date.parse(item.publishedAt))).map((item: NewsApiArticle, index: number) => {
      const { companies, sectors } = tagEntities(item.title || '', item.description || '', companyId);
      return {
        id: stableArticleId(item.url || '', item.title || `newsapi-${index}`),
        title: item.title || 'Market Update',
        summary: item.description || item.title || '',
        source: item.source?.name || 'Financial News',
        sourceUrl: item.url || '#',
        publishedAt: item.publishedAt!,
        imageUrl: item.urlToImage || null,
        sentiment: classifySentiment(item.title || ''),
        category: classifyCategory(item.title || ''),
        createdAt: item.publishedAt!,
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
      { next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.articles)) return [];

    return data.articles.filter((item: GNewsArticle) => item.publishedAt && !isNaN(Date.parse(item.publishedAt))).map((item: GNewsArticle, index: number) => {
      const { companies, sectors } = tagEntities(item.title || '', item.description || '', companyId);
      return {
        id: stableArticleId(item.url || '', item.title || `gnews-${index}`),
        title: item.title || 'Market Update',
        summary: item.description || item.title || '',
        source: item.source?.name || 'GNews Feed',
        sourceUrl: item.url || '#',
        publishedAt: item.publishedAt!,
        imageUrl: item.image || null,
        sentiment: classifySentiment(item.title || ''),
        category: classifyCategory(item.title || ''),
        createdAt: item.publishedAt!,
        companies,
        sectors,
      };
    });
  } catch {
    return [];
  }
}

// Calendar day in India, rather than a rolling 24-hour window or the server's timezone.
export function isCurrentDay(dateStr: string, now = new Date()): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  if (date.getTime() > now.getTime()) return false;
  const indiaDay = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return indiaDay.format(date) === indiaDay.format(now);
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

    const items: NewsArticleWithRelations[] = (feed.items || []).slice(0, 35)
      .filter(item => !isNaN(Date.parse(item.isoDate || item.pubDate || '')))
      .map((item, index) => {
      const lastDash = (item.title || '').lastIndexOf(' - ');
      let title = item.title || 'Market Update';
      let source = (item as RssFeedItem).source?._ || item.creator || 'Financial News';
      if (lastDash !== -1) {
        title = (item.title || '').substring(0, lastDash).trim();
        source = (item.title || '').substring(lastDash + 3).trim();
      }

      const publishedAt = item.isoDate || item.pubDate || '';
      const summary = item.contentSnippet || item.content || title;
      const { companies, sectors } = tagEntities(title, summary, companyId, sectorId);

      return {
        id: stableArticleId(item.link || '', title || `rss-${index}`),
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

    newsCache[cacheKey] = { items, expiresAt: Date.now() + CACHE_TTL };
    return items;
  } catch (err) {
    console.error('RSS fetch error for query:', finalQuery, err);
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

  let localArticles = db.getNewsArticlesWithRelations({
    companyId,
    sectorId,
    category: category === 'all' ? undefined : category,
    sentiment,
    search,
    limit: 100,
    offset: 0,
  }) as NewsArticleWithRelations[];

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

  if (liveItems.length > 0) {
    // A search-engine query is not proof that an article is about the company.
    // Keep company pages clean by requiring a genuine title/summary entity match.
    let filteredLive = liveItems;
    if (companyId) {
      filteredLive = filteredLive.filter(item => item.companies.some(c => c.id === companyId));
    }
    if (category && category !== 'all') {
      filteredLive = filteredLive.filter(item => item.category === category);
    }
    if (sentiment) {
      filteredLive = filteredLive.filter(item => item.sentiment === sentiment);
    }
    if (search && search.trim()) {
      const sq = search.toLowerCase();
      filteredLive = filteredLive.filter(
        item => item.title.toLowerCase().includes(sq) || item.summary.toLowerCase().includes(sq)
      );
    }

    const existingTitles = new Set(
      localArticles.map(a => a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30))
    );

    const freshNewItems = filteredLive.filter(item => {
      const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
      return !existingTitles.has(norm);
    });

    localArticles = [...freshNewItems, ...localArticles];
  }

  // Filter for today's articles strictly if todayOnly is requested
  if (todayOnly) {
    localArticles = localArticles.filter(a => isCurrentDay(a.publishedAt));
  }

  // Sort by publishedAt desc (newest first)
  localArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const total = localArticles.length;
  const paginated = localArticles.slice(offset, offset + limit);

  return {
    articles: paginated,
    total,
    lastUpdated: new Date().toISOString(),
  };
}
