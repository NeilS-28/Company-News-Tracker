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
    const company = db.getCompanyBySlug(slug);

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const quote = await getMarketQuote(company.ticker);

    // Get company news
    const { articles } = await getAggregatedNews({
      companyId: company.id,
      limit: 25,
    });

    // Get peer companies in the same sector
    const peers = db
      .getCompaniesBySector(company.sectorSlug)
      .filter(c => c.id !== company.id)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        company,
        quote,
        news: articles,
        peers,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
