import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    if (!q) {
      return NextResponse.json({ success: true, data: [] });
    }

    const companies = db.searchCompanies(q).slice(0, 8);
    const sectors = db.getSectors().filter(
      s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    ).slice(0, 4);

    const companiesWithQuotes = await Promise.all(
      companies.map(async (c) => {
        let quote = null;
        try {
          quote = await getMarketQuote(c.ticker);
        } catch {
          // Ignore
        }
        return {
          type: 'company' as const,
          id: c.id,
          name: c.name,
          shortName: c.shortName,
          ticker: c.ticker,
          sector: c.sector,
          slug: c.slug,
          quote,
        };
      })
    );

    const sectorResults = sectors.map(s => ({
      type: 'sector' as const,
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
    }));

    return NextResponse.json({
      success: true,
      data: [...companiesWithQuotes, ...sectorResults],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
