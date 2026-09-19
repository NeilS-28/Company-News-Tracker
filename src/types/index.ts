// Shared TypeScript types for Company News Tracker

// ============================================================
// Database entity types
// ============================================================

export interface Company {
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

export interface Sector {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  imageUrl: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  category: NewsCategory;
  createdAt: string;
}

export type NewsCategory =
  | 'all'
  | 'company'
  | 'results'
  | 'management'
  | 'corporate-actions'
  | 'mna'
  | 'regulation'
  | 'products'
  | 'analyst'
  | 'deals-rumours'
  | 'clarifications'
  | 'other';

export type DealStatus =
  | 'unverified-rumour'
  | 'in-talks'
  | 'confirmed'
  | 'denied'
  | 'sebi-clarification';

export interface DealRadarItem extends NewsArticleWithRelations {
  dealStatus: DealStatus;
  dealType: 'mna' | 'stake-sale' | 'joint-venture' | 'expansion' | 'clarification' | 'other';
  targetCompany?: string;
  sourceConfidence?: 'high' | 'medium' | 'speculative';
  officialResponse?: string;
}

export interface ArticleCompany {
  articleId: number;
  companyId: number;
  relevanceScore: number;
}

export interface ArticleSector {
  articleId: number;
  sectorId: number;
  relevanceScore: number;
}

export interface Watchlist {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistCompany {
  watchlistId: number;
  companyId: number;
  position: number;
}

// ============================================================
// API / UI types
// ============================================================

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  timestamp: string;
  /** Indicates the freshness / origin of this quote */
  status: 'live' | 'delayed' | 'baseline';
  /** The data provider name (e.g. 'Yahoo Finance', 'Finnhub', 'Baseline Ref') */
  source?: string;
}

export interface CompanyWithQuote extends Company {
  quote?: MarketQuote | null;
  recentNewsCount?: number;
  latestHeadline?: string | null;
}

export interface NewsArticleWithRelations extends NewsArticle {
  companies: Pick<Company, 'id' | 'name' | 'ticker' | 'slug'>[];
  sectors: Pick<Sector, 'id' | 'name' | 'slug'>[];
}

export interface SectorWithCompanies extends Sector {
  companies: Company[];
  companyCount: number;
}

export interface WatchlistWithCompanies extends Watchlist {
  companies: Company[];
}

export interface SearchResult {
  type: 'company' | 'sector' | 'industry';
  name: string;
  slug: string;
  ticker?: string;
  sector?: string;
  matchedField: string;
}

// ============================================================
// API request / response types
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface NewsFilters {
  company?: string;
  sector?: string;
  category?: NewsCategory;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MarketOverview {
  nifty50: MarketQuote | null;
  sensex: MarketQuote | null;
  niftyBank: MarketQuote | null;
  timestamp: string;
}

// ============================================================
// Theme
// ============================================================

export type Theme = 'light' | 'dark';

// ============================================================
// Bookmark / Read state (client-side)
// ============================================================

export interface UserPreferences {
  theme: Theme;
  readArticles: Set<number>;
  bookmarkedArticles: Set<number>;
}
