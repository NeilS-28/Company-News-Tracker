import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleNewsRss } from '@/lib/providers/news';
import { fetchNseFilings } from '@/lib/providers/filings';
import { hasPersistentStore } from '@/lib/supabase-store';
import { pruneNews, recordHealth, storeNews } from '@/lib/news-store';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (!secret || provided.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPersistentStore) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });

  const results: Record<string, number | string> = {};
  for (const [source, fetcher] of [
    ['news', () => fetchGoogleNewsRss('Indian stock market business news Sensex Nifty BSE NSE', undefined, undefined, true, false, true)],
    ['nse-filing', fetchNseFilings],
  ] as const) {
    try {
      const articles = await fetcher();
      if (!articles.length) throw new Error('Feed returned no valid articles');
      await storeNews(source, articles);
      await recordHealth(source, true, articles.length);
      results[source] = articles.length;
    } catch (error) {
      console.error(`Ingestion failed for ${source}`, error);
      results[source] = 'unavailable';
      try { await recordHealth(source, false, 0); } catch (healthError) { console.error('Health write failed', healthError); }
    }
  }
  try { await pruneNews(); } catch (error) { console.error('Archive pruning failed', error); }
  return NextResponse.json({ results });
}
