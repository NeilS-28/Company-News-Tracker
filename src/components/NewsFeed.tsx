'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NEWS_CATEGORIES } from '@/lib/constants';
import { NewsArticleWithRelations, NewsCategory } from '@/types';
import NewsCard from './NewsCard';
import { Search, RefreshCw, Clock, Sparkles, CheckCircle2, ChevronDown } from 'lucide-react';

interface NewsFeedProps {
  initialArticles?: NewsArticleWithRelations[];
  companyId?: number;
  sectorId?: number;
  title?: string;
}

type AutoRefreshOption = '5m' | '15m' | '30m' | 'off';

const INTERVAL_SECONDS: Record<AutoRefreshOption, number> = {
  '5m': 5 * 60,
  '15m': 15 * 60,
  '30m': 30 * 60,
  'off': 0,
};

function getRelativeTimeString(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function NewsFeed({
  initialArticles,
  companyId,
  sectorId,
  title = 'Market & Company News',
}: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticleWithRelations[]>(initialArticles || []);
  const [category, setCategory] = useState<NewsCategory>('all');
  const [sentiment, setSentiment] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [relativeTime, setRelativeTime] = useState<string>('Just now');
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  // Auto-refresh configuration (default to 15m as requested)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<AutoRefreshOption>('15m');
  const [secondsLeft, setSecondsLeft] = useState<number>(INTERVAL_SECONDS['15m']);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);

  const pillsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load saved interval preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pulse_news_refresh_interval') as AutoRefreshOption;
      if (saved && INTERVAL_SECONDS[saved] !== undefined) {
        setAutoRefreshInterval(saved);
        setSecondsLeft(INTERVAL_SECONDS[saved]);
      }
    } catch {
      // Ignore localStorage errors in SSR or restricted environments
    }
  }, []);

  // Close interval dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowIntervalMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Horizontal scroll handler for category pills
  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: 'smooth' });
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const fetchNews = useCallback(
    async (resetPage = false, force = false) => {
      setLoading(true);
      if (force) {
        setIsManualRefreshing(true);
      }
      try {
        const currentPage = resetPage ? 0 : page;
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);
        if (sentiment !== 'all') params.set('sentiment', sentiment);
        if (search.trim()) params.set('search', search.trim());
        if (companyId) params.set('companyId', String(companyId));
        if (sectorId) params.set('sectorId', String(sectorId));
        if (force) params.set('refresh', 'true');
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

          const now = new Date();
          setLastUpdated(now);
          setRelativeTime('Just now');

          if (force) {
            setShowRefreshSuccess(true);
            setTimeout(() => setShowRefreshSuccess(false), 2500);
          }
        }
      } catch (err) {
        console.error('Failed to fetch news feed', err);
      } finally {
        setLoading(false);
        setIsManualRefreshing(false);
      }
    },
    [category, sentiment, search, companyId, sectorId, page]
  );

  // Initial and dependency-driven fetch
  useEffect(() => {
    fetchNews(true, false);
  }, [category, sentiment, companyId, sectorId]);

  // Handle interval timer ticking & relative time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Update relative time string
      setRelativeTime(getRelativeTimeString(lastUpdated));

      // 2. Decrement auto-refresh countdown
      if (autoRefreshInterval !== 'off') {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Trigger auto-refresh
            fetchNews(true, true);
            return INTERVAL_SECONDS[autoRefreshInterval];
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, lastUpdated, fetchNews]);

  const handleManualRefresh = () => {
    fetchNews(true, true);
    if (autoRefreshInterval !== 'off') {
      setSecondsLeft(INTERVAL_SECONDS[autoRefreshInterval]);
    }
  };

  const handleIntervalChange = (opt: AutoRefreshOption) => {
    setAutoRefreshInterval(opt);
    setSecondsLeft(INTERVAL_SECONDS[opt]);
    setShowIntervalMenu(false);
    try {
      localStorage.setItem('pulse_news_refresh_interval', opt);
    } catch {
      // Ignore
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(true, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);

    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (sentiment !== 'all') params.set('sentiment', sentiment);
    if (search.trim()) params.set('search', search.trim());
    if (companyId) params.set('companyId', String(companyId));
    if (sectorId) params.set('sectorId', String(sectorId));
    params.set('limit', '15');
    params.set('offset', String(nextPage * 15));

    fetch(`/api/news?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setArticles((prev) => [...prev, ...json.data]);
        }
      });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        {/* Feed Title & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{title}</span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {total} {total === 1 ? 'story' : 'stories'}
            </span>
          </h2>
          <span className="live-indicator" title="Live Indian Financial News Feed" />
        </div>

        {/* Action Controls: Auto-refresh selector, Manual Refresh & Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Relative Time & Auto-refresh Timer Pill */}
          <div
            ref={menuRef}
            style={{
              position: 'relative',
              display: 'inline-flex',
            }}
          >
            <button
              type="button"
              onClick={() => setShowIntervalMenu((prev) => !prev)}
              title="Click to change auto-refresh frequency"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <Clock size={13} color="var(--accent-primary)" />
              <span>
                {autoRefreshInterval === 'off' ? (
                  <span style={{ color: 'var(--text-muted)' }}>Auto: Off</span>
                ) : (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>Auto: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{autoRefreshInterval}</strong>
                  </>
                )}
              </span>
              <ChevronDown size={12} color="var(--text-muted)" />
            </button>

            {/* Dropdown Menu for Auto-refresh Interval */}
            {showIntervalMenu && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.35rem',
                  zIndex: 50,
                  minWidth: 175,
                  padding: '0.4rem',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div
                  style={{
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Auto-Update Interval
                </div>
                {(
                  [
                    { key: '15m', label: 'Every 15 mins (Recommended)' },
                    { key: '30m', label: 'Every 30 mins' },
                    { key: '5m', label: 'Every 5 mins (Fast)' },
                    { key: 'off', label: 'Manual Only (Off)' },
                  ] as const
                ).map(({ key, label }) => {
                  const isActive = autoRefreshInterval === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleIntervalChange(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 600 : 400,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <span>{label}</span>
                      {isActive && <CheckCircle2 size={13} color="var(--accent-primary)" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Headline Input */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.825rem',
              }}
            >
              <Search size={13} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter headlines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  width: 130,
                  fontSize: '0.825rem',
                }}
              />
            </div>
          </form>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading}
            title={`Last updated ${relativeTime} (${lastUpdated.toLocaleTimeString()}). Click to refresh news feed.`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.42rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              background: isManualRefreshing
                ? 'var(--accent-glow)'
                : 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(2, 132, 199, 0.25))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: 'var(--accent-primary)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <RefreshCw
              size={13}
              className={isManualRefreshing || loading ? 'animate-spin' : ''}
            />
            <span>{isManualRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Status Bar / Last Updated Feedback */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          padding: '0 0.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>
            Last updated: <strong style={{ color: 'var(--text-secondary)' }}>{relativeTime}</strong>
          </span>
          <span>•</span>
          <span title={lastUpdated.toISOString()}>
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          {showRefreshSuccess && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'var(--bullish)',
                fontWeight: 600,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <CheckCircle2 size={12} /> News feed updated
            </span>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div
        ref={pillsRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
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
          const label =
            s === 'all' ? 'All' : s === 'positive' ? 'Bullish' : s === 'negative' ? 'Bearish' : 'Neutral';
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
                transition: 'all 0.15s ease',
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
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
          >
            {loading ? 'Loading...' : `Load More News (${total - articles.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
