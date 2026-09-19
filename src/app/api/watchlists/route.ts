import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    // If logged in, get their personal watchlists; otherwise return public/default watchlists
    const watchlists = db.getWatchlists(user ? user.id : undefined);

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

    return NextResponse.json({
      success: true,
      data: enriched,
      isPersonalized: Boolean(user),
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const name = (body.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const created = db.createWatchlist(name, user ? user.id : undefined);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
