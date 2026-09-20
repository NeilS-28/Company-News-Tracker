// App-wide constants

export const APP_NAME = 'MarketPulse';
export const APP_DESCRIPTION = 'Indian Stock Market News & Research Dashboard';

export const NEWS_PAGE_SIZE = 20;
export const COMPANIES_PAGE_SIZE = 50;

export const NEWS_CATEGORIES = [
  { value: 'all', label: 'All News' },
  { value: 'company', label: 'Company' },
  { value: 'results', label: 'Results' },
  { value: 'management', label: 'Management' },
  { value: 'corporate-actions', label: 'Corporate Actions' },
  { value: 'mna', label: 'M&A' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'products', label: 'Products & Business' },
  { value: 'analyst', label: 'Analyst & Brokerage' },
  { value: 'other', label: 'Other' },
] as const;

export const MARKET_INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50', displayName: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX', displayName: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'NIFTY Bank', displayName: 'NIFTY Bank' },
] as const;

// Indian market news sources for reference
export const NEWS_SOURCES = [
  'Economic Times',
  'Moneycontrol',
  'LiveMint',
  'Business Standard',
  'NDTV Profit',
  'Financial Express',
  'The Hindu BusinessLine',
  'Bloomberg Quint',
  'Reuters India',
] as const;
