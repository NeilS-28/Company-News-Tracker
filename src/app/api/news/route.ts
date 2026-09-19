import { NEWS_CATEGORIES } from '@/lib/constants';
import { ApiError, positiveId } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedNews } from '@/lib/providers/news';
import { NewsCategory } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') as NewsCategory) || 'all';
    const companyId = searchParams.get('companyId') ? positiveId(searchParams.get('companyId')) : undefined;
    const sectorId = searchParams.get('sectorId') ? positiveId(searchParams.get('sectorId')) : undefined;
    const sentiment = (searchParams.get('sentiment') as 'positive' | 'negative' | 'neutral') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = Number(searchParams.get('limit') || '20');
    const offset = Number(searchParams.get('offset') || '0');
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || offset > 1000) throw new ApiError(400, 'Invalid pagination.');
    if (!NEWS_CATEGORIES.some(item => item.value === category)) throw new ApiError(400, 'Invalid category.');
    if (sentiment && !['positive', 'negative', 'neutral'].includes(sentiment)) throw new ApiError(400, 'Invalid sentiment.');
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
    const message = err instanceof ApiError ? err.message : 'News is temporarily unavailable. Please retry.';
    return NextResponse.json({ success: false, error: message }, { status: err instanceof ApiError ? err.status : 503 });
  }
}
