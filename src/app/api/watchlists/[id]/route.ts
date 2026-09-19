import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';
import { getAggregatedNews } from '@/lib/providers/news';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const watchlistId = Number(id);
    const watchlist = db.getWatchlistById(watchlistId);

    if (!watchlist) {
      return NextResponse.json({ success: false, error: 'Watchlist not found' }, { status: 404 });
    }

    const companies = db.getWatchlistCompanies(watchlistId);

    // Enrich with quotes
    const companiesWithQuotes = await Promise.all(
      companies.map(async (c) => {
        const quote = await getMarketQuote(c.ticker);
        return {
          ...c,
          quote,
        };
      })
    );

    // Collect news for all companies in this watchlist
    const newsPromises = companies.map((c) =>
      getAggregatedNews({ companyId: c.id, limit: 10 })
    );
    const newsResults = await Promise.all(newsPromises);
    const allArticles = newsResults.flatMap((res) => res.articles);

    // Deduplicate by ID and sort newest first
    const seenIds = new Set<number>();
    const uniqueNews = allArticles.filter((article) => {
      if (seenIds.has(article.id)) return false;
      seenIds.add(article.id);
      return true;
    }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        watchlist,
        companies: companiesWithQuotes,
        news: uniqueNews.slice(0, 30),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const watchlistId = Number(id);
    const user = await getCurrentUser(request);
    const watchlist = db.getWatchlistById(watchlistId);

    if (!watchlist) {
      return NextResponse.json({ success: false, error: 'Watchlist not found' }, { status: 404 });
    }

    if (watchlist.userId && (!user || user.id !== watchlist.userId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to modify this watchlist' }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const updated = db.updateWatchlist(watchlistId, name, user ? user.id : undefined);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Watchlist update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const watchlistId = Number(id);
    const user = await getCurrentUser(request);
    const watchlist = db.getWatchlistById(watchlistId);

    if (!watchlist) {
      return NextResponse.json({ success: false, error: 'Watchlist not found' }, { status: 404 });
    }

    if (watchlist.userId && (!user || user.id !== watchlist.userId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to delete this watchlist' }, { status: 403 });
    }

    const ok = db.deleteWatchlist(watchlistId, user ? user.id : undefined);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Watchlist deletion failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const watchlistId = Number(id);
    const user = await getCurrentUser(request);
    const watchlist = db.getWatchlistById(watchlistId);

    if (!watchlist) {
      return NextResponse.json({ success: false, error: 'Watchlist not found' }, { status: 404 });
    }

    if (watchlist.userId && (!user || user.id !== watchlist.userId)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to modify this watchlist' }, { status: 403 });
    }

    const body = await request.json();
    const { action, companyId } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Company ID required' }, { status: 400 });
    }

    if (action === 'remove') {
      db.removeCompanyFromWatchlist(watchlistId, companyId);
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      db.addCompanyToWatchlist(watchlistId, companyId);
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
