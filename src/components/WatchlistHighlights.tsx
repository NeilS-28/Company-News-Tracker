'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { NewsArticleWithRelations } from '@/types';
import { formatDate } from '@/lib/utils';

interface HighlightState {
  userId: string;
  name: string;
  companyCount: number;
  articles: NewsArticleWithRelations[];
  lastVisit: number | null;
}

export default function WatchlistHighlights() {
  const { user, loading: authLoading } = useAuth();
  const [highlights, setHighlights] = useState<HighlightState | null>(null);
  const [hasWatchlists, setHasWatchlists] = useState(false);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    const userId = user.id;

    async function load() {
      try {
        const listResponse = await fetch('/api/watchlists', { cache: 'no-store' });
        if (!listResponse.ok) throw new Error('Could not load watchlists');
        const list = await listResponse.json();
        if (!list.success || !Array.isArray(list.data)) throw new Error('Could not load watchlists');
        if (!active) return;
        setHasWatchlists(list.data.length > 0);
        const selected = list.data.find((w: { companyCount: number }) => w.companyCount > 0);
        if (!selected) return;
        const visitKey = `mp-watchlist-last-visit-${userId}-${selected.id}`;

        const response = await fetch(`/api/watchlists/${selected.id}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Could not load watchlist news');
        const detail = await response.json();
        if (!detail.success || !active) return;

        const stored = localStorage.getItem(visitKey);
        const lastVisit = stored && Number.isFinite(Number(stored)) ? Number(stored) : null;
        setHighlights({
          userId,
          name: selected.name,
          companyCount: selected.companyCount,
          articles: detail.data.news,
          lastVisit,
        });
        localStorage.setItem(visitKey, String(Date.now()));
      } catch {
        // A failed request must not mark the feed as read.
      } finally {
        if (active) setPending(false);
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, user]);

  if (!user || authLoading || pending || (highlights && highlights.userId !== user.id)) return null;

  const newCount = highlights?.lastVisit
    ? highlights.articles.filter(a => new Date(a.publishedAt).getTime() > highlights.lastVisit!).length
    : 0;

  return (
    <section className="watchlist-highlights" aria-label="Your watchlist news">
      <div className="watchlist-highlights-heading">
        <div>
          <p className="section-eyebrow">YOUR WATCHLIST</p>
          <h2>{highlights ? highlights.name : 'Follow your companies'}</h2>
          <p className="watchlist-highlights-detail">
            {highlights
              ? `${highlights.companyCount} companies · ${highlights.lastVisit ? `${newCount} new ${newCount === 1 ? 'story' : 'stories'} in the latest feed` : 'Recent stories'}`
              : hasWatchlists ? 'Add a company to see its news here.' : 'Create a watchlist to follow company news.'}
          </p>
        </div>
        <Link href="/watchlists" className="editorial-link">Manage watchlists →</Link>
      </div>
      {highlights && (
        <div className="watchlist-headlines">
          {highlights.articles.length ? highlights.articles.slice(0, 4).map(article => (
            <a key={article.id} href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="watchlist-headline">
              <span className="watchlist-headline-title">{article.title}</span>
              <span className="watchlist-headline-meta">
                {highlights.lastVisit && new Date(article.publishedAt).getTime() > highlights.lastVisit && <strong>NEW · </strong>}
                {article.source} · {formatDate(article.publishedAt)}
              </span>
            </a>
          )) : <p className="watchlist-highlights-detail">No matching stories found for this watchlist yet.</p>}
        </div>
      )}
    </section>
  );
}
