// Read-only company/sector catalogue. Only the seed script writes this file.
// User watchlists are stored separately in Supabase; seeded news is never served.

import fs from 'fs';
import path from 'path';

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
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getEmptyDb(): DbSchema {
  return {
    companies: [],
    sectors: [],
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
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      this.data = JSON.parse(raw) as DbSchema;
    } else {
      this.data = getEmptyDb();
    }
    return this.data;
  }

  private save() {
    ensureDataDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Invalidate cache to re-read from disk on next access (useful for API routes)
  reload() {
    this.data = null;
  }

  // ---- Companies ----
  getCompanies(): CompanyRow[] {
    return [...this.load().companies];
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

  // ---- Bulk write (used by seed) ----
  writeAll(data: DbSchema) {
    this.data = data;
    this.save();
  }
}

// Singleton
export const db = new JsonDatabase();
