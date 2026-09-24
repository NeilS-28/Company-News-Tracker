import Parser from 'rss-parser';
import crypto from 'crypto';
import type { NewsArticleWithRelations } from '@/types';
import { tagEntities } from '@/lib/providers/news';

// Published by NSE on https://www.nseindia.com/static/rss-feed.
export const NSE_ANNOUNCEMENTS_FEED = 'https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml';

export async function fetchNseFilings(): Promise<NewsArticleWithRelations[]> {
  const parser = new Parser({ timeout: 7000, headers: { 'User-Agent': 'MarketPulse RSS reader (public announcements)' } });
  const feed = await parser.parseURL(NSE_ANNOUNCEMENTS_FEED);
  return (feed.items || []).slice(0, 70).flatMap(item => {
    const title = item.title?.trim();
    const sourceUrl = item.link?.trim();
    const publishedAt = item.isoDate || item.pubDate;
    if (!title || !sourceUrl?.startsWith('https://') || !publishedAt || !Number.isFinite(Date.parse(publishedAt))) return [];
    const digest = crypto.createHash('sha256').update(`nse:${sourceUrl}`).digest();
    const { companies, sectors } = tagEntities(title, item.contentSnippet || '');
    return [{
      id: 100000 + (digest.readUInt32BE(0) % 1900000000),
      title, summary: (item.contentSnippet || title).slice(0, 500), source: 'NSE filing', sourceUrl,
      publishedAt: new Date(publishedAt).toISOString(), imageUrl: null,
      sentiment: 'neutral' as const, category: 'company' as const,
      createdAt: new Date(publishedAt).toISOString(), companies, sectors,
    }];
  });
}
