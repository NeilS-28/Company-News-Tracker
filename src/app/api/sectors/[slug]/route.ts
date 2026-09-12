import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';
import { getAggregatedNews } from '@/lib/providers/news';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sector = db.getSectorBySlug(slug);

    if (!sector) {
      return NextResponse.json({ success: false, error: 'Sector not found' }, { status: 404 });
    }

    const companies = db.getCompaniesBySector(sector.slug);

    // Enrich companies with quotes
    const companiesWithQuotes = await Promise.all(
      companies.map(async (c) => {
        const quote = await getMarketQuote(c.ticker);
        return {
          ...c,
          quote,
        };
      })
    );

    // Aggregate news for this sector
    const { articles } = await getAggregatedNews({
      sectorId: sector.id,
      limit: 30,
    });

    return NextResponse.json({
      success: true,
      data: {
        sector,
        companies: companiesWithQuotes,
        news: articles,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
