import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    const watchlists = db.getWatchlists();
    const enriched = watchlists.map((wl) => {
      const companies = db.getWatchlistCompanies(wl.id);
      return {
        ...wl,
        companyCount: companies.length,
        companies: companies.map(c => ({
          id: c.id,
          name: c.name,
          ticker: c.ticker,
          slug: c.slug,
        })),
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const created = db.createWatchlist(name);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
