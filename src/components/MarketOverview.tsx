'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { NewsArticleWithRelations } from '@/types';

export default function MarketOverview() {
  const [headlines, setHeadlines] = useState<NewsArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const newsRes = await fetch('/api/news?limit=3&todayOnly=true');
        if (newsRes.ok) {
          const newsJson = await newsRes.json();
          if (newsJson.success && Array.isArray(newsJson.data)) {
            setHeadlines(newsJson.data.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Failed to load top headlines', err);
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
      <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="glass-panel skeleton" style={{ width: 220, height: 24 }} />
        </div>
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

  if (headlines.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Top 3 Headlines Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent-primary)',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Today&apos;s Highlights
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Top Market Headlines
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Top 3 Headlines Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {headlines.map((article, index) => {
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
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {article.source}
                    </span>
                  </div>

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
    </div>
  );
}
