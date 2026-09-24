import crypto from 'crypto';
import type { NewsArticleWithRelations } from '@/types';
import { request } from '@/lib/supabase-store';

export type NewsSource = 'news' | 'nse-filing';
type ArchiveRow = { article: NewsArticleWithRelations };
type HealthRow = { provider: NewsSource; checked_at: string; last_success_at: string | null; status: 'ok' | 'error'; item_count: number };

export function articleKey(source: NewsSource, url: string): string {
  return crypto.createHash('sha256').update(`${source}:${url}`).digest('hex');
}

export async function storedNews(): Promise<NewsArticleWithRelations[]> {
  const rows = await request<ArchiveRow[]>('marketpulse_news_archive?select=article&order=published_at.desc&limit=180');
  return rows.map(row => row.article);
}

export async function storeNews(source: NewsSource, articles: NewsArticleWithRelations[]): Promise<void> {
  if (!articles.length) return;
  const now = Date.now();
  const recent = articles.filter(a => a.sourceUrl.startsWith('https://') &&
    Number.isFinite(Date.parse(a.publishedAt)) && Date.parse(a.publishedAt) <= now &&
    Date.parse(a.publishedAt) > now - 30 * 86400000).slice(0, 70);
  if (!recent.length) return;
  await request<unknown[]>('marketpulse_news_archive?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(recent.map(article => ({ id: articleKey(source, article.sourceUrl), source_type: source, published_at: article.publishedAt, article }))),
  });
}

export async function pruneNews(): Promise<void> {
  await request<unknown[]>(`marketpulse_news_archive?published_at=lt.${encodeURIComponent(new Date(Date.now() - 30 * 86400000).toISOString())}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  await request<unknown[]>(`marketpulse_auth_attempts?window_start=lt.${encodeURIComponent(new Date(Date.now() - 86400000).toISOString())}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}

export async function providerHealth(): Promise<HealthRow[]> {
  return request<HealthRow[]>('marketpulse_provider_health?select=provider,checked_at,last_success_at,status,item_count');
}

export async function recordHealth(provider: NewsSource, ok: boolean, count: number): Promise<void> {
  const previous = await providerHealth();
  const now = new Date().toISOString();
  await request<unknown[]>('marketpulse_provider_health?on_conflict=provider', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ provider, checked_at: now, last_success_at: ok ? now : previous.find(row => row.provider === provider)?.last_success_at || null, status: ok ? 'ok' : 'error', item_count: count }),
  });
}
