import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPersistentStore, persistentWatchlists, persistentCompanyIds, createPersistentWatchlist } from '@/lib/supabase-store';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    const watchlists = hasPersistentStore ? await persistentWatchlists(user.id) : db.getWatchlists(user.id);
    const enriched = await Promise.all(watchlists.map(async wl => {
      const companies = hasPersistentStore
        ? (await persistentCompanyIds(wl.id)).map(id => db.getCompanyById(id)).filter(Boolean)
        : db.getWatchlistCompanies(wl.id);
      return { ...wl, companyCount: companies.length, companies: companies.map(c => ({ id: c!.id, name: c!.name, ticker: c!.ticker, slug: c!.slug })) };
    }));
    return NextResponse.json({ success: true, data: enriched, isPersonalized: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    const name = ((await request.json()).name || '').trim();
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    const created = hasPersistentStore ? await createPersistentWatchlist(name, user.id) : db.createWatchlist(name, user.id);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) { return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 }); }
}
