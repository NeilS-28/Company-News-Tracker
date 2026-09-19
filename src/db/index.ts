// Simple JSON-file-based database for development
// Provides a clean interface that can be swapped with PostgreSQL/SQLite for production

import fs from 'fs';
import path from 'path';
import equitiesMaster from './equities_master.json';

export interface DbSchema {
  companies: CompanyRow[];
  sectors: SectorRow[];
  newsArticles: NewsArticleRow[];
  articleCompanies: ArticleCompanyRow[];
  articleSectors: ArticleSectorRow[];
  watchlists: WatchlistRow[];
  watchlistCompanies: WatchlistCompanyRow[];
}

export interface CompanyRow {
  id: number;
  name: string;
  shortName: string;
  ticker: string;
  sector: string;
  sectorSlug: string;
  industry: string;
  description: string;
  logoUrl: string | null;
  isNifty50: boolean;
  isActive: boolean;
  slug: string;
}

export interface SectorRow {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface NewsArticleRow {
  id: number;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  imageUrl: string | null;
  sentiment: string | null;
  category: string;
  createdAt: string;
}

export interface ArticleCompanyRow {
  id: number;
  articleId: number;
  companyId: number;
  relevanceScore: number;
}

export interface ArticleSectorRow {
  id: number;
  articleId: number;
  sectorId: number;
  relevanceScore: number;
}

export interface WatchlistRow {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistCompanyRow {
  id: number;
  watchlistId: number;
  companyId: number;
  position: number;
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function ensureDataDir() {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {
    // Read-only environment on serverless hosts like Vercel
  }
}

const sectorSlugMap: Record<string, string> = {
  'Information Technology': 'information-technology',
  'Financial Services': 'financial-services',
  'Oil, Gas & Consumable Fuels': 'oil-gas-and-consumable-fuels',
  'Automobiles & Auto Components': 'automobiles-and-auto-components',
  'Fast Moving Consumer Goods': 'fast-moving-consumer-goods',
  'Pharmaceuticals': 'pharmaceuticals',
  'Metals & Mining': 'metals-and-mining',
  'Construction': 'construction',
  'Telecommunication': 'telecommunication',
  'Power': 'power',
  'Consumer Durables': 'consumer-durables',
  'Healthcare Services': 'healthcare-services',
  'Capital Goods': 'capital-goods',
  'Diversified': 'diversified',
  'Services': 'services',
  'Consumer Services': 'consumer-services',
  'Chemicals': 'chemicals',
  'Realty & Real Estate': 'realty-and-real-estate',
  'Textiles & Apparel': 'textiles-and-apparel',
  'Media & Entertainment': 'media-and-entertainment',
  'Forest Materials & Paper': 'forest-materials-and-paper',
};

function getFallbackDb(): DbSchema {
  const sectors: SectorRow[] = Object.keys(sectorSlugMap).map((name, i) => ({
    id: i + 1,
    name,
    slug: sectorSlugMap[name],
    description: `Equities and market tracking for ${name}`,
  }));

  const companies: CompanyRow[] = (
    equitiesMaster as Array<{
      name: string;
      shortName: string;
      ticker: string;
      sector: string;
      industry: string;
      description: string;
    }>
  ).map((item, idx) => ({
    id: idx + 1,
    name: item.name,
    shortName: item.shortName,
    ticker: item.ticker,
    sector: item.sector,
    sectorSlug: sectorSlugMap[item.sector] || 'diversified',
    industry: item.industry,
    description: item.description,
    logoUrl: null,
    isNifty50: idx < 50,
    isActive: true,
    slug: item.ticker.toLowerCase(),
  }));

  return {
    companies,
    sectors,
    newsArticles: [],
    articleCompanies: [],
    articleSectors: [],
    watchlists: [],
    watchlistCompanies: [],
  };
}

class JsonDatabase {
  private data: DbSchema | null = null;

  private load(): DbSchema {
    if (this.data) return this.data;
    try {
      ensureDataDir();
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw) as DbSchema;
        if (this.data && Array.isArray(this.data.companies) && this.data.companies.length > 0) {
          return this.data;
        }
      }
    } catch {
      // Ignore read errors on serverless
    }

    this.data = getFallbackDb();
    return this.data;
  }

  private save() {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {
      // In read-only serverless environments (e.g. Vercel), fallback to in-memory state
    }
  }

  // Invalidate cache to re-read from disk on next access (useful for API routes)
  reload() {
    this.data = null;
  }

  // ---- Companies ----
  getCompanies(): CompanyRow[] {
    return this.load().companies;
  }

  getCompanyBySlug(slug: string): CompanyRow | undefined {
    const s = slug.toLowerCase();
    return this.load().companies.find(c => c.slug.toLowerCase() === s || c.ticker.toLowerCase() === s);
  }

  getCompanyByTicker(ticker: string): CompanyRow | undefined {
    const t = ticker.toUpperCase().replace('.NS', '').replace('.BO', '');
    return this.load().companies.find(c => c.ticker.toUpperCase() === t);
  }

  getCompanyById(id: number): CompanyRow | undefined {
    return this.load().companies.find(c => c.id === id);
  }

  getCompaniesBySector(sectorSlug: string): CompanyRow[] {
    return this.load().companies.filter(c => c.sectorSlug === sectorSlug);
  }

  getNifty50Companies(): CompanyRow[] {
    return this.load().companies.filter(c => c.isNifty50);
  }

  searchCompanies(query: string): CompanyRow[] {
    const q = query.toLowerCase();
    return this.load().companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.ticker.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q)
    );
  }

  // ---- Sectors ----
  getSectors(): SectorRow[] {
    return this.load().sectors;
  }

  getSectorBySlug(slug: string): SectorRow | undefined {
    return this.load().sectors.find(s => s.slug === slug);
  }

  // ---- News Articles ----
  getNewsArticles(opts?: {
    limit?: number;
    offset?: number;
    category?: string;
    companyId?: number;
    sectorId?: number;
    sentiment?: string;
    search?: string;
  }): NewsArticleRow[] {
    const data = this.load();
    let articles = [...data.newsArticles];

    if (opts?.companyId) {
      const articleIds = new Set(
        data.articleCompanies.filter(ac => ac.companyId === opts.companyId).map(ac => ac.articleId)
      );
      articles = articles.filter(a => articleIds.has(a.id));
    }

    if (opts?.sectorId) {
      const articleIds = new Set(
        data.articleSectors.filter(as2 => as2.sectorId === opts.sectorId).map(as2 => as2.articleId)
      );
      articles = articles.filter(a => articleIds.has(a.id));
    }

    if (opts?.category && opts.category !== 'all') {
      articles = articles.filter(a => a.category === opts.category);
    }

    if (opts?.sentiment) {
      articles = articles.filter(a => a.sentiment === opts.sentiment);
    }

    if (opts?.search) {
      const q = opts.search.toLowerCase();
      articles = articles.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
    }

    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 20;
    return articles.slice(offset, offset + limit);
  }

  getNewsArticlesWithRelations(opts?: {
    limit?: number;
    offset?: number;
    category?: string;
    companyId?: number;
    sectorId?: number;
    sentiment?: string;
    search?: string;
  }) {
    const articles = this.getNewsArticles(opts);
    return articles.map(article => ({
      ...article,
      companies: this.getArticleCompanies(article.id).map(c => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        slug: c.slug,
      })),
      sectors: this.getArticleSectors(article.id).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
      })),
    }));
  }

  getNewsCount(category?: string): number {
    if (category && category !== 'all') {
      return this.load().newsArticles.filter(a => a.category === category).length;
    }
    return this.load().newsArticles.length;
  }

  getArticlesByCompanyId(companyId: number, limit = 20): NewsArticleRow[] {
    const articleIds = this.load().articleCompanies
      .filter(ac => ac.companyId === companyId)
      .map(ac => ac.articleId);
    return this.load().newsArticles
      .filter(a => articleIds.includes(a.id))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }

  getArticlesBySectorId(sectorId: number, limit = 20): NewsArticleRow[] {
    const articleIds = this.load().articleSectors
      .filter(as2 => as2.sectorId === sectorId)
      .map(as2 => as2.articleId);
    return this.load().newsArticles
      .filter(a => articleIds.includes(a.id))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }

  getArticleCompanies(articleId: number): CompanyRow[] {
    const companyIds = this.load().articleCompanies
      .filter(ac => ac.articleId === articleId)
      .map(ac => ac.companyId);
    return this.load().companies.filter(c => companyIds.includes(c.id));
  }

  getArticleSectors(articleId: number): SectorRow[] {
    const sectorIds = this.load().articleSectors
      .filter(as2 => as2.articleId === articleId)
      .map(as2 => as2.sectorId);
    return this.load().sectors.filter(s => sectorIds.includes(s.id));
  }

  getRecentNewsCountForCompany(companyId: number): number {
    const articleIds = this.load().articleCompanies
      .filter(ac => ac.companyId === companyId)
      .map(ac => ac.articleId);
    return articleIds.length;
  }

  getLatestHeadlineForCompany(companyId: number): string | null {
    const articles = this.getArticlesByCompanyId(companyId, 1);
    return articles.length > 0 ? articles[0].title : null;
  }

  addNewsArticle(article: Omit<NewsArticleRow, 'id'>, companyIds: number[], sectorIds: number[]): NewsArticleRow {
    const db = this.load();
    const id = (db.newsArticles.length > 0 ? Math.max(...db.newsArticles.map(a => a.id)) : 0) + 1;
    const newArticle: NewsArticleRow = { ...article, id };
    db.newsArticles.push(newArticle);

    for (const companyId of companyIds) {
      const acId = (db.articleCompanies.length > 0 ? Math.max(...db.articleCompanies.map(ac => ac.id)) : 0) + 1;
      db.articleCompanies.push({ id: acId, articleId: id, companyId, relevanceScore: 1.0 });
    }

    for (const sectorId of sectorIds) {
      const asId = (db.articleSectors.length > 0 ? Math.max(...db.articleSectors.map(as2 => as2.id)) : 0) + 1;
      db.articleSectors.push({ id: asId, articleId: id, sectorId, relevanceScore: 1.0 });
    }

    this.save();
    return newArticle;
  }

  // ---- Watchlists ----
  getWatchlists(): WatchlistRow[] {
    return this.load().watchlists;
  }

  getWatchlistById(id: number): WatchlistRow | undefined {
    return this.load().watchlists.find(w => w.id === id);
  }

  createWatchlist(name: string): WatchlistRow {
    const db = this.load();
    const id = (db.watchlists.length > 0 ? Math.max(...db.watchlists.map(w => w.id)) : 0) + 1;
    const now = new Date().toISOString();
    const watchlist: WatchlistRow = { id, name, createdAt: now, updatedAt: now };
    db.watchlists.push(watchlist);
    this.save();
    return watchlist;
  }

  updateWatchlist(id: number, name: string): WatchlistRow | null {
    const db = this.load();
    const idx = db.watchlists.findIndex(w => w.id === id);
    if (idx === -1) return null;
    db.watchlists[idx].name = name;
    db.watchlists[idx].updatedAt = new Date().toISOString();
    this.save();
    return db.watchlists[idx];
  }

  deleteWatchlist(id: number): boolean {
    const db = this.load();
    const idx = db.watchlists.findIndex(w => w.id === id);
    if (idx === -1) return false;
    db.watchlists.splice(idx, 1);
    db.watchlistCompanies = db.watchlistCompanies.filter(wc => wc.watchlistId !== id);
    this.save();
    return true;
  }

  getWatchlistCompanies(watchlistId: number): CompanyRow[] {
    const companyIds = this.load().watchlistCompanies
      .filter(wc => wc.watchlistId === watchlistId)
      .sort((a, b) => a.position - b.position)
      .map(wc => wc.companyId);
    return companyIds.map(cid => this.getCompanyById(cid)!).filter(Boolean);
  }

  addCompanyToWatchlist(watchlistId: number, companyId: number): boolean {
    const db = this.load();
    const exists = db.watchlistCompanies.find(
      wc => wc.watchlistId === watchlistId && wc.companyId === companyId
    );
    if (exists) return false;
    const maxPos = db.watchlistCompanies
      .filter(wc => wc.watchlistId === watchlistId)
      .reduce((max, wc) => Math.max(max, wc.position), -1);
    const id = (db.watchlistCompanies.length > 0 ? Math.max(...db.watchlistCompanies.map(wc => wc.id)) : 0) + 1;
    db.watchlistCompanies.push({ id, watchlistId, companyId, position: maxPos + 1 });
    // Update watchlist timestamp
    const wl = db.watchlists.find(w => w.id === watchlistId);
    if (wl) wl.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  removeCompanyFromWatchlist(watchlistId: number, companyId: number): boolean {
    const db = this.load();
    const idx = db.watchlistCompanies.findIndex(
      wc => wc.watchlistId === watchlistId && wc.companyId === companyId
    );
    if (idx === -1) return false;
    db.watchlistCompanies.splice(idx, 1);
    const wl = db.watchlists.find(w => w.id === watchlistId);
    if (wl) wl.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  isCompanyInWatchlist(watchlistId: number, companyId: number): boolean {
    return this.load().watchlistCompanies.some(
      wc => wc.watchlistId === watchlistId && wc.companyId === companyId
    );
  }

  // ---- Bulk write (used by seed) ----
  writeAll(data: DbSchema) {
    this.data = data;
    this.save();
  }
}

// Singleton
export const db = new JsonDatabase();
