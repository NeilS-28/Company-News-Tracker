import Parser from 'rss-parser';
import crypto from 'crypto';
import { DealRadarItem, DealStatus } from '@/types';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  timeout: 5000,
});

// Official Investor Relations (IR) Portals for NIFTY 50 companies
export const COMPANY_IR_PORTALS: Record<string, { irUrl: string; pressReleaseUrl?: string }> = {
  RELIANCE: { irUrl: 'https://www.ril.com/investor-relations', pressReleaseUrl: 'https://www.ril.com/media-releases' },
  TCS: { irUrl: 'https://www.tcs.com/investor-relations', pressReleaseUrl: 'https://www.tcs.com/newsroom' },
  HDFCBANK: { irUrl: 'https://www.hdfcbank.com/personal/about-us/investor-relations' },
  INFY: { irUrl: 'https://www.infosys.com/investors.html', pressReleaseUrl: 'https://www.infosys.com/newsroom.html' },
  ICICIBANK: { irUrl: 'https://www.icicibank.com/about-us/investor-relations' },
  BHARTIARTL: { irUrl: 'https://www.airtel.in/about-bharti/equity' },
  SBIN: { irUrl: 'https://sbi.co.in/web/investor-relations' },
  LICI: { irUrl: 'https://licindia.in/investor-relations' },
  ITC: { irUrl: 'https://www.itcportal.com/investor' },
  HINDUNILVR: { irUrl: 'https://www.hul.co.in/investor-relations' },
  LT: { irUrl: 'https://www.larsentoubro.com/corporate/investors' },
  BAJFINANCE: { irUrl: 'https://www.bajajfinserv.in/investor-relations' },
  HCLTECH: { irUrl: 'https://www.hcltech.com/investors' },
  MARUTI: { irUrl: 'https://www.marutisuzuki.com/corporate/investors' },
  SUNPHARMA: { irUrl: 'https://sunpharma.com/investors' },
  TATAMOTORS: { irUrl: 'https://www.tatamotors.com/investors' },
  KOTAKBANK: { irUrl: 'https://www.kotak.com/en/investor-relations.html' },
  TITAN: { irUrl: 'https://www.titancompany.in/investors' },
  ONGC: { irUrl: 'https://ongcindia.com/investors' },
  ADANIENT: { irUrl: 'https://www.adanienterprises.com/investors' },
  NTPC: { irUrl: 'https://ntpc.co.in/investors' },
  AXISBANK: { irUrl: 'https://www.axisbank.com/shareholders-corner' },
  TRENT: { irUrl: 'https://trentlimited.com/investor-relations' },
  BEL: { irUrl: 'https://bel-india.in/investor-relations' },
  ULTRACEMCO: { irUrl: 'https://www.ultratechcement.com/investors' },
};

export function classifyDealStatus(title: string, summary: string): {
  status: DealStatus;
  dealType: 'mna' | 'stake-sale' | 'joint-venture' | 'expansion' | 'clarification' | 'other';
  confidence: 'high' | 'medium' | 'speculative';
} {
  const text = `${title} ${summary}`.toLowerCase();

  // 1. SEBI Exchange Clarifications
  if (
    text.includes('clarification on') ||
    text.includes('clarifies on') ||
    text.includes('exchange query') ||
    text.includes('media report clarification') ||
    text.includes('lodr')
  ) {
    return {
      status: 'sebi-clarification',
      dealType: 'clarification',
      confidence: 'high',
    };
  }

  // 2. Denied Rumours
  if (
    text.includes('denies') ||
    text.includes('refutes') ||
    text.includes('baseless') ||
    text.includes('rejects speculation') ||
    text.includes('no talks')
  ) {
    return {
      status: 'denied',
      dealType: 'clarification',
      confidence: 'high',
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
      status: 'confirmed',
      dealType,
      confidence: 'high',
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
      status: 'in-talks',
      dealType: text.includes('jv') ? 'joint-venture' : text.includes('stake') ? 'stake-sale' : 'mna',
      confidence: 'medium',
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

    const items: DealRadarItem[] = (feed.items || []).slice(0, 15)
      .filter(item => !isNaN(Date.parse(item.isoDate || item.pubDate || '')))
      .map((item) => {
      const rawTitle = item.title || 'Corporate Deal Update';
      const lastDash = rawTitle.lastIndexOf(' - ');
      const title = lastDash > 0 ? rawTitle.slice(0, lastDash) : rawTitle;
      const source = lastDash > 0 ? rawTitle.slice(lastDash + 3) : item.creator || 'Publisher unknown';
      const summary = item.contentSnippet || item.content || title;
      const { status, dealType, confidence } = classifyDealStatus(title, summary);
      const publishedAt = item.isoDate || item.pubDate || '';

      return {
        id: 400000 + (crypto.createHash('sha256').update(`${item.link || ''}|${rawTitle}`).digest().readUInt32BE(0) % 1900000000),
        title,
        summary,
        source,
        sourceUrl: item.link || '#',
        publishedAt,
        imageUrl: null,
        sentiment: status === 'denied' ? 'negative' : status === 'confirmed' ? 'positive' : 'neutral',
        category: 'deals-rumours',
        createdAt: publishedAt,
        dealStatus: status,
        dealType,
        sourceConfidence: confidence,
        companies: [],
        sectors: [],
      };
    });

    dealCache[cacheKey] = { items, expiresAt: Date.now() + CACHE_TTL };
    return items;
  } catch {
    return [];
  }
}
