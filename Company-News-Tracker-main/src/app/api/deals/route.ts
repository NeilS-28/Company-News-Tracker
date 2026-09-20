import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveDealsAndRumours, classifyDealStatus, COMPANY_IR_PORTALS } from '@/lib/providers/deals';
import { db } from '@/db';
import { DealRadarItem, DealStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DealStatus | 'all' | null;
    const companyId = searchParams.get('companyId') ? Number(searchParams.get('companyId')) : undefined;
    const search = searchParams.get('search')?.toLowerCase();

    // 1. Get database articles that relate to M&A, corporate actions, or deals
    const dbArticles = db.getNewsArticlesWithRelations({
      companyId,
      limit: 50,
    });

    // Filter to articles that match deal/rumour terms or mna category
    const dealKeywords = ['deal', 'acquire', 'acquisition', 'merger', 'stake', 'in talks', 'joint venture', 'jv', 'buyout', 'bid', 'clarification', 'denies', 'amalgamation'];
    const filteredDbArticles = dbArticles.filter(a => {
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return a.category === 'mna' || a.category === 'deals-rumours' || dealKeywords.some(k => text.includes(k));
    });

    const transformedDbDeals: DealRadarItem[] = filteredDbArticles.map(a => {
      const { status: classifiedStatus, dealType, confidence } = classifyDealStatus(a.title, a.summary);
      return {
        ...a,
        sentiment: (a.sentiment as 'positive' | 'negative' | 'neutral' | null) ?? 'neutral',
        category: 'deals-rumours' as const,
        dealStatus: classifiedStatus,
        dealType,
        sourceConfidence: confidence,
      };
    });

    // 2. Fetch live real-time deal scoops
    let companyTicker: string | undefined;
    if (companyId) {
      const c = db.getCompanyById(companyId);
      if (c) companyTicker = c.shortName || c.name;
    }

    const liveDeals = await fetchLiveDealsAndRumours(companyTicker);

    // Merge and deduplicate by title
    const seenTitles = new Set<string>();
    let allDeals: DealRadarItem[] = [];

    for (const d of [...liveDeals, ...transformedDbDeals]) {
      const key = d.title.toLowerCase().slice(0, 40);
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        allDeals.push(d);
      }
    }

    // Apply status filter
    if (status && status !== 'all') {
      allDeals = allDeals.filter(d => d.dealStatus === status);
    }

    // Apply search filter
    if (search) {
      allDeals = allDeals.filter(d =>
        d.title.toLowerCase().includes(search) || d.summary.toLowerCase().includes(search)
      );
    }

    // Sort newest first
    allDeals.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Attach IR portal info if companyId provided
    let irInfo = null;
    if (companyId) {
      const c = db.getCompanyById(companyId);
      if (c && COMPANY_IR_PORTALS[c.ticker]) {
        irInfo = COMPANY_IR_PORTALS[c.ticker];
      }
    }

    return NextResponse.json({
      success: true,
      data: allDeals,
      total: allDeals.length,
      irInfo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
