'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NEWS_CATEGORIES } from '@/lib/constants';
import type { NewsArticleWithRelations, NewsCategory } from '@/types';
import NewsCard from './NewsCard';

export default function NewsFeed({
  initialArticles = [],
  companyId,
  sectorId,
  title = 'Market & Company News',
}: {
  initialArticles?: NewsArticleWithRelations[];
  companyId?: number;
  sectorId?: number;
  title?: string;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [category, setCategory] = useState<NewsCategory>('all');
  const [sentiment, setSentiment] = useState('all');
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(initialArticles.length);
  const [offset, setOffset] = useState(0);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const requestRef = useRef<AbortController | null>(null);
  const fetchNews = useCallback(
    async (nextOffset = 0, refresh = false) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const params = new URLSearchParams({
          category,
          limit: '15',
          offset: String(nextOffset),
        });
        if (sentiment !== 'all') params.set('sentiment', sentiment);
        if (search) params.set('search', search);
        if (companyId) params.set('companyId', String(companyId));
        if (sectorId) params.set('sectorId', String(sectorId));
        if (refresh) params.set('refresh', 'true');
        const res = await fetch(`/api/news?${params}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error('News is temporarily unavailable. Please retry.');
        if (controller.signal.aborted) return;
        const incoming: NewsArticleWithRelations[] = json.data;
        setArticles((previous) => {
          if (!nextOffset) return incoming;
          const seen = new Set(previous.map((article) => article.id));
          return [
            ...previous,
            ...incoming.filter((article) => !seen.has(article.id)),
          ];
        });
        setError(null);
        setTotal(json.total);
        setOffset(nextOffset + incoming.length);
        setCheckedAt(new Date().toISOString());
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Unable to load news.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [category, sentiment, search, companyId, sectorId],
  );
  useEffect(() => {
    // Network response callbacks update state after awaited I/O.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNews();
    return () => requestRef.current?.abort();
  }, [fetchNews]);
  useEffect(() => {
    if (!intervalMinutes) return;
    const timer = setInterval(
      () => void fetchNews(0, true),
      intervalMinutes * 60_000,
    );
    return () => clearInterval(timer);
  }, [intervalMinutes, fetchNews]);
  function resetFilters() {
    setArticles([]);
    setTotal(0);
    setOffset(0);
    setCheckedAt(null);
    setError(null);
    setLoading(true);
  }
  return (
    <section className="stack">
      <h2>{title}</h2>
      <div className="action-row">
        <form
          className="action-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (search !== draftSearch.trim()) {
              resetFilters();
              setSearch(draftSearch.trim());
            }
          }}
        >
          <label htmlFor={`news-search-${companyId || sectorId || 'all'}`}>
            Headlines
          </label>
          <input
            id={`news-search-${companyId || sectorId || 'all'}`}
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder="Filter headlines"
          />
          <button className="action-button">Search</button>
        </form>
        <button
          className="action-button"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            void fetchNews(0, true);
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <label>
          Auto-refresh{' '}
          <select
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
          >
            {[0, 5, 15, 30].map((value) => (
              <option key={value} value={value}>
                {value ? `${value} min` : 'Off'}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="action-row" aria-label="News categories">
        {NEWS_CATEGORIES.map((item) => (
          <button
            className="action-button"
            key={item.value}
            aria-pressed={category === item.value}
            onClick={() => {
              if (category !== item.value) {
                resetFilters();
                setCategory(item.value as NewsCategory);
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label>
        Automated headline tone{' '}
        <select
          value={sentiment}
          onChange={(e) => {
            resetFilters();
            setSentiment(e.target.value);
          }}
        >
          <option value="all">All</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral / mixed</option>
        </select>
      </label>
      <small>
        Headline tone uses keywords; it is not a verified assessment or
        investment signal.
      </small>
      {checkedAt && (
        <small>Last checked: {new Date(checkedAt).toLocaleTimeString()}</small>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error} {articles.length > 0 && 'Showing previously loaded articles.'}
        </p>
      )}
      {loading && !articles.length ? (
        <p role="status">Loading news…</p>
      ) : !error && !articles.length ? (
        <p>No news matches these filters.</p>
      ) : (
        articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))
      )}
      {offset < total && (
        <button
          className="action-button"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            void fetchNews(offset);
          }}
        >
          Load more news
        </button>
      )}
    </section>
  );
}
