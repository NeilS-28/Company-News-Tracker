'use client';

import { useState, useEffect, useRef } from 'react';
import { NEWS_CATEGORIES } from '@/lib/constants';
import { NewsArticleWithRelations, NewsCategory } from '@/types';
import NewsCard from './NewsCard';
import { Filter, Search, RefreshCw } from 'lucide-react';

interface NewsFeedProps {
  initialArticles?: NewsArticleWithRelations[];
  companyId?: number;
  sectorId?: number;
  title?: string;
}

export default function NewsFeed({ initialArticles, companyId, sectorId, title = 'Latest Market News' }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticleWithRelations[]>(initialArticles || []);
  const [category, setCategory] = useState<NewsCategory>('all');
  const [sentiment, setSentiment] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const fetchNews = async (resetPage = false) => {
    setLoading(true);
    try {
      const currentPage = resetPage ? 0 : page;
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (sentiment !== 'all') params.set('sentiment', sentiment);
      if (search.trim()) params.set('search', search.trim());
      if (companyId) params.set('companyId', String(companyId));
      if (sectorId) params.set('sectorId', String(sectorId));
      params.set('limit', '15');
      params.set('offset', String(currentPage * 15));

      const res = await fetch(`/api/news?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        if (resetPage || currentPage === 0) {
          setArticles(json.data);
        } else {
          setArticles((prev) => [...prev, ...json.data]);
        }
        setTotal(json.total);
        if (resetPage) setPage(0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(true);
  }, [category, sentiment, companyId, sectorId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    // Trigger load
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (sentiment !== 'all') params.set('sentiment', sentiment);
    if (search.trim()) params.set('search', search.trim());
    if (companyId) params.set('companyId', String(companyId));
    if (sectorId) params.set('sectorId', String(sectorId));
    params.set('limit', '15');
    params.set('offset', String(nextPage * 15));

    fetch(`/api/news?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setArticles(prev => [...prev, ...json.data]);
        }
      });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{title}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ({total} stories)
          </span>
        </h2>

        {/* Search inside news */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.35rem 0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter headlines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: 150 }}
            />
          </div>
          <button
            type="button"
            onClick={() => fetchNews(true)}
            title="Refresh news feed"
            style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'skeleton' : ''} />
          </button>
        </form>
      </div>

      {/* Category Pills Bar */}
      <div
        ref={pillsRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
          flexWrap: 'nowrap',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {NEWS_CATEGORIES.map((cat) => {
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value as NewsCategory)}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 500,
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: isActive ? '#080c14' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'transparent' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sentiment Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Sentiment:</span>
        {['all', 'positive', 'negative', 'neutral'].map((s) => {
          const isActive = sentiment === s;
          const label = s === 'all' ? 'All' : s === 'positive' ? 'Bullish' : s === 'negative' ? 'Bearish' : 'Neutral';
          return (
            <button
              key={s}
              onClick={() => setSentiment(s)}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--border-medium)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* News Articles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && articles.length === 0 ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel skeleton" style={{ height: 130 }} />
          ))
        ) : articles.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            No news articles match your active filter or search query.
          </div>
        ) : (
          articles.map((article) => <NewsCard key={article.id} article={article} />)
        )}
      </div>

      {/* Load More Button */}
      {articles.length < total && (
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <button
            onClick={handleLoadMore}
            disabled={loading}
            style={{
              padding: '0.65rem 1.75rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Loading...' : `Load More News (${total - articles.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
