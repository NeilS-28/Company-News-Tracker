'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Activity, Building2 } from 'lucide-react';
import { formatPercent, formatDate, getSentimentBadge } from '@/lib/utils';
import { NewsArticleWithRelations } from '@/types';

interface MarketMoversData {
  gainers: Array<{
    symbol: string;
    name: string;
    slug: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
  losers: Array<{
    symbol: string;
    name: string;
    slug: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
  updatedAt?: string;
}

export default function MarketOverview() {
  const [headlines, setHeadlines] = useState<NewsArticleWithRelations[]>([]);
  const [movers, setMovers] = useState<MarketMoversData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [newsRes, marketRes] = await Promise.allSettled([
          fetch('/api/news?limit=3'),
          fetch('/api/market'),
        ]);

        if (newsRes.status === 'fulfilled') {
          const newsJson = await newsRes.value.json();
          if (newsJson.success && Array.isArray(newsJson.data)) {
            setHeadlines(newsJson.data.slice(0, 3));
          }
        }

        if (marketRes.status === 'fulfilled') {
          const marketJson = await marketRes.value.json();
          if (marketJson.success && marketJson.data) {
            setMovers({
              gainers: marketJson.data.gainers || [],
              losers: marketJson.data.losers || [],
              updatedAt: marketJson.data.updatedAt,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load top headlines or movers', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel skeleton" style={{ height: 160 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>



      {/* Top 3 Headlines Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {headlines.map((article, index) => {
          const sentiment = getSentimentBadge(article.sentiment);
          const rankColors = [
            { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
            { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8' },
            { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' },
          ];
          const rankStyle = rankColors[index] || rankColors[0];

          return (
            <div
              key={article.id}
              className="glass-panel"
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              {/* Top Accent Line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, ${rankStyle.text} 0%, transparent 100%)`,
                }}
              />

              {/* Meta Header */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: rankStyle.bg,
                        border: `1px solid ${rankStyle.border}`,
                        color: rankStyle.text,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      TOP STORY #{index + 1}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {article.source}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: sentiment.bg,
                      color: sentiment.text,
                      border: `1px solid ${sentiment.border}`,
                    }}
                  >
                    {sentiment.label}
                  </span>
                </div>

                {/* Headline Link */}
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '0.4rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                >
                  <span>{article.title}</span>
                </a>

                {/* Summary snippet */}
                {article.summary && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.summary}
                  </p>
                )}
              </div>

              {/* Bottom Meta & Companies */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {article.companies && article.companies.length > 0 ? (
                    article.companies.map((c) => (
                      <Link
                        key={c.id}
                        href={`/company/${c.slug}`}
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: 'rgba(56, 189, 248, 0.08)',
                          color: 'var(--accent-primary)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <Building2 size={10} />
                        <span>{c.ticker || c.name}</span>
                      </Link>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Market Wide</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                    {formatDate(article.publishedAt)}
                  </span>
                  <ExternalLink size={11} style={{ opacity: 0.7 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Gainers & Losers Ticker Strip */}
      {movers && (movers.gainers.length > 0 || movers.losers.length > 0) && (
        <div
          className="glass-panel"
          style={{
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Activity size={13} color="var(--accent-primary)" />
            Movers
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {movers.gainers.slice(0, 3).map((g) => (
              <Link
                key={g.symbol}
                href={`/company/${g.slug}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</span>
                <span style={{ color: 'var(--bullish)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {formatPercent(g.changePercent)}
                </span>
              </Link>
            ))}

            <span style={{ color: 'var(--border-medium)' }}>|</span>

            {movers.losers.slice(0, 3).map((l) => (
              <Link
                key={l.symbol}
                href={`/company/${l.slug}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</span>
                <span style={{ color: 'var(--bearish)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {formatPercent(l.changePercent)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
