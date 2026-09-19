'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, Plus, Trash2, Building2, TrendingUp, TrendingDown, Newspaper, Download } from 'lucide-react';
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
  const loadWatchlistsList = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlists');
      const json = await res.json();
      if (json.success) {
        setWatchlists(json.data);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Load active watchlist details & news
  const loadWatchlistData = useCallback(async (id: number) => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/watchlists')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) setWatchlists(json.data);
      })
      .catch(() => {});

    fetch(`/api/watchlists/${activeWatchlistId}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setData(json.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
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

  const handleExportCSV = () => {
    if (!data || !data.companies.length) return;
    const headers = ['Ticker', 'Name', 'Sector', 'Price', 'ChangePercent'];
    const rows = data.companies.map((c) => [
      c.ticker,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.sector.replace(/"/g, '""')}"`,
      c.quote?.price ?? '',
      c.quote?.changePercent ?? '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${data.watchlist.name.toLowerCase().replace(/\s+/g, '_')}_watchlist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!data || !data.companies.length) return;
    const jsonString = JSON.stringify(data.companies, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.watchlist.name.toLowerCase().replace(/\s+/g, '_')}_watchlist.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        {/* Watchlist Picker / Creator / Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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

          {data && data.companies.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={handleExportCSV}
                title="Export Watchlist as CSV"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                title="Export Watchlist as JSON"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                <span>JSON</span>
              </button>
            </div>
          )}
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
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Building2 size={40} opacity={0.4} />
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Your Watchlist is Empty
            </h3>
            <p style={{ fontSize: '0.875rem', maxWidth: 460 }}>
              Search for NSE/BSE listed companies or browse sectors to add tickers to this watchlist.
            </p>
          </div>
          <Link
            href="/companies"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#080c14',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Browse Companies
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.75rem' }}>
          {/* Left Column: Watchlist Companies Table */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tracked Equities ({data.companies.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.companies.map((c) => {
                const quote = c.quote;
                const isPos = (quote?.changePercent ?? 0) >= 0;
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleRemoveCompany(c.id)}
                        title="Remove from watchlist"
                        style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bearish)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={16} />
                      </button>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Link
                            href={`/company/${c.slug}`}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              fontSize: '0.95rem',
                              textDecoration: 'none',
                            }}
                          >
                            {c.ticker}
                          </Link>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • {c.sector}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.shortName || c.name}
                        </span>
                      </div>
                    </div>

                    {quote ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(quote.price)}
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            color: isPos ? 'var(--bullish)' : 'var(--bearish)',
                          }}
                        >
                          {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span>{formatPercent(quote.changePercent)}</span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>N/A</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Combined News Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Newspaper size={18} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Watchlist News Feed ({data.news.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.news.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No recent news headlines for tracked companies.
                </div>
              ) : (
                data.news.map((article) => <NewsCard key={article.id} article={article} />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
