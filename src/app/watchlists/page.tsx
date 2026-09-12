'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Plus, Trash2, Building2, TrendingUp, TrendingDown, Newspaper } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { CompanyWithQuote, NewsArticleWithRelations } from '@/types';
import NewsCard from '@/components/NewsCard';

interface WatchlistData {
  watchlist: { id: number; name: string };
  companies: CompanyWithQuote[];
  news: NewsArticleWithRelations[];
}

export default function WatchlistsPage() {
  const [data, setData] = useState<WatchlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [watchlists, setWatchlists] = useState<Array<{ id: number; name: string; companyCount: number }>>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<number>(1);

  // Load all watchlists
  const loadWatchlistsList = async () => {
    try {
      const res = await fetch('/api/watchlists');
      const json = await res.json();
      if (json.success) {
        setWatchlists(json.data);
      }
    } catch {
      // Fallback
    }
  };

  // Load active watchlist details & news
  const loadWatchlistData = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/watchlists/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlistsList();
    loadWatchlistData(activeWatchlistId);
  }, [activeWatchlistId]);

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;

    try {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWatchlistName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewWatchlistName('');
        setShowCreate(false);
        await loadWatchlistsList();
        setActiveWatchlistId(json.data.id);
      }
    } catch {
      // Fallback
    }
  };

  const handleRemoveCompany = async (companyId: number) => {
    try {
      await fetch(`/api/watchlists/${activeWatchlistId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', companyId }),
      });
      loadWatchlistData(activeWatchlistId);
      loadWatchlistsList();
    } catch {
      // Fallback
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#eab308',
            }}
          >
            <Star size={22} fill="currentColor" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Watchlists & Custom News Stream
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Aggregate tailored headlines and corporate filings for the exact companies you follow
            </p>
          </div>
        </div>

        {/* Watchlist Picker / Creator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {watchlists.map((wl) => (
            <button
              key={wl.id}
              onClick={() => setActiveWatchlistId(wl.id)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: activeWatchlistId === wl.id ? 700 : 500,
                background: activeWatchlistId === wl.id ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: activeWatchlistId === wl.id ? '#080c14' : 'var(--text-secondary)',
                border: `1px solid ${activeWatchlistId === wl.id ? 'transparent' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
            >
              {wl.name} ({wl.companyCount})
            </button>
          ))}

          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* New Watchlist Inline Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateWatchlist}
          className="glass-panel"
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: 480,
          }}
        >
          <input
            type="text"
            placeholder="Watchlist Name (e.g. Banking Stocks, Tech Leaders)"
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#080c14',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Create
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.75rem' }}>
          <div className="glass-panel skeleton" style={{ height: 400 }} />
          <div className="glass-panel skeleton" style={{ height: 400 }} />
        </div>
      ) : !data || data.companies.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Star size={40} color="var(--text-muted)" />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              No companies in &quot;{data?.watchlist?.name || 'Watchlist'}&quot; yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 460 }}>
              Browse Indian listed companies and click the Star icon on any card to add them to your personalized news stream.
            </p>
          </div>
          <Link
            href="/companies"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#080c14',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            <Building2 size={16} />
            <span>Browse Companies</span>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
            gap: '1.75rem',
          }}
        >
          {/* Left Column: Aggregated News for Watchlisted Companies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Watchlist News Stream
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {data.news.length} stories
              </span>
            </div>

            {data.news.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent stories for the companies in this watchlist.
              </div>
            ) : (
              data.news.map((item) => <NewsCard key={item.id} article={item} />)
            )}
          </div>

          {/* Right Column: Watchlisted Companies & Quotes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Monitored Companies ({data.companies.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.companies.map((comp) => {
                const isPos = (comp.quote?.changePercent ?? 0) >= 0;
                return (
                  <div
                    key={comp.id}
                    className="glass-panel"
                    style={{
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <Link
                      href={`/company/${comp.slug}`}
                      style={{ textDecoration: 'none', flex: 1 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {comp.ticker}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • {comp.sector}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {comp.shortName || comp.name}
                      </span>
                    </Link>

                    {comp.quote && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(comp.quote.price)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            color: isPos ? 'var(--bullish)' : 'var(--bearish)',
                            fontWeight: 600,
                          }}
                        >
                          {formatPercent(comp.quote.changePercent)}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveCompany(comp.id)}
                      title="Remove from watchlist"
                      style={{
                        padding: '0.35rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bearish)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
