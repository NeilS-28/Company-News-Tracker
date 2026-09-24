import { NextResponse } from 'next/server';
import { hasPersistentStore } from '@/lib/supabase-store';
import { providerHealth } from '@/lib/news-store';

export async function GET() {
  if (!hasPersistentStore) return NextResponse.json({ sources: [], archive: 'unavailable' });
  try {
    return NextResponse.json({ sources: await providerHealth(), archive: 'available' }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch {
    return NextResponse.json({ sources: [], archive: 'unavailable' }, { status: 503 });
  }
}
