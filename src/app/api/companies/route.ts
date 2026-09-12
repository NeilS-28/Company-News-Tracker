import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectorSlug = searchParams.get('sector');
    const search = searchParams.get('search');
    const filter = searchParams.get('filter'); // 'all' | 'nifty50'
    const sortBy = searchParams.get('sort') || 'name'; // 'name' | 'ticker' | 'news'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));

    let companies = db.getCompanies();

    if (filter === 'nifty50') {
      companies = companies.filter(c => c.isNifty50);
    }

    if (sectorSlug && sectorSlug !== 'all') {
      companies = companies.filter(c => c.sectorSlug === sectorSlug);
    }

    if (search) {
      const q = search.toLowerCase();
      companies = companies.filter(
        c =>
          c.ticker.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q)
      );
    }

    const total = companies.length;

    // Sorting
    if (sortBy === 'ticker') {
      companies.sort((a, b) => a.ticker.localeCompare(b.ticker));
    } else if (sortBy === 'news') {
      companies.sort((a, b) => {
        const countA = db.getRecentNewsCountForCompany(a.id);
        const countB = db.getRecentNewsCountForCompany(b.id);
        return countB - countA;
      });
    } else {
      // Default: prioritize Nifty 50 constituents first, then alphabetical by name
      companies.sort((a, b) => {
        if (a.isNifty50 && !b.isNifty50) return -1;
        if (!a.isNifty50 && b.isNifty50) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    // Paginate slice
    const startIndex = (page - 1) * limit;
    const paginatedCompanies = companies.slice(startIndex, startIndex + limit);

    // Attach quote and news stats for the current page only
    const enrichedCompanies = await Promise.all(
      paginatedCompanies.map(async (company) => {
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

    return NextResponse.json({
      success: true,
      data: enrichedCompanies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
