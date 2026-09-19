import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedNews } from '@/lib/providers/news';
import { NewsCategory } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') as NewsCategory) || 'all';
    const companyId = searchParams.get('companyId') ? Number(searchParams.get('companyId')) : undefined;
    const sectorId = searchParams.get('sectorId') ? Number(searchParams.get('sectorId')) : undefined;
    const sentiment = (searchParams.get('sentiment') as 'positive' | 'negative' | 'neutral') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = Number(searchParams.get('limit') || '20');
    const offset = Number(searchParams.get('offset') || '0');
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';
    const todayOnly = searchParams.get('todayOnly') === 'true';

    const result = await getAggregatedNews({
      category,
      companyId,
      sectorId,
      sentiment,
      search,
      limit,
      offset,
      forceRefresh,
      todayOnly,
    });

    return NextResponse.json({
      success: true,
      data: result.articles,
      total: result.total,
      lastUpdated: result.lastUpdated,
      limit,
      offset,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
