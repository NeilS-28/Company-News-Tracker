import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectorSlug = searchParams.get('sector');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort') || 'name'; // 'name' | 'change' | 'news'

    let companies = db.getCompanies();

    if (sectorSlug && sectorSlug !== 'all') {
      companies = companies.filter(c => c.sectorSlug === sectorSlug);
    }

    if (search) {
      const q = search.toLowerCase();
      companies = companies.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q)
      );
    }

    // Attach quote and news stats
    const enrichedCompanies = await Promise.all(
      companies.map(async (company) => {
        let quote = null;
        try {
          quote = await getMarketQuote(company.ticker);
        } catch {
          // Keep null if error
        }

        const recentNewsCount = db.getRecentNewsCountForCompany(company.id);
        const latestHeadline = db.getLatestHeadlineForCompany(company.id);

        return {
          ...company,
          quote,
          recentNewsCount,
          latestHeadline,
        };
      })
    );

    if (sortBy === 'change') {
      enrichedCompanies.sort((a, b) => (b.quote?.changePercent ?? 0) - (a.quote?.changePercent ?? 0));
    } else if (sortBy === 'news') {
      enrichedCompanies.sort((a, b) => (b.recentNewsCount ?? 0) - (a.recentNewsCount ?? 0));
    } else {
      enrichedCompanies.sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      success: true,
      data: enrichedCompanies,
      total: enrichedCompanies.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
