'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Sector, CompanyWithQuote, NewsArticleWithRelations } from '@/types';
import NewsCard from '@/components/NewsCard';

interface SectorDetailData {
  sector: Sector;
  companies: CompanyWithQuote[];
  news: NewsArticleWithRelations[];
}

export default function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<SectorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sectors/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Sector not found');
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load sector');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel skeleton" style={{ height: 160 }} />
        <div className="research-grid">
          <div className="glass-panel skeleton" style={{ height: 400 }} />
          <div className="glass-panel skeleton" style={{ height: 400 }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--bearish)', marginBottom: '0.5rem' }}>
          {error || 'Sector not found'}
        </h2>
        <Link href="/sectors" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
          &larr; Back to all sectors
        </Link>
      </div>
    );
  }

  const { sector, companies, news } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/sectors"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={16} />
          <span>Back to all Sectors</span>
        </Link>
      </div>

      {/* Sector Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--accent-primary)',
            }}
          >
            Sector Intelligence
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {companies.length} listed equities
          </span>
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {sector.name}
        </h1>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 800, lineHeight: 1.5 }}>
          {sector.description}
        </p>
      </div>

      {/* Main 2-Column: Left = News, Right = Sector Constituents */}
      <div className="research-grid">
        {/* Left: Sector News Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {sector.name} News & Updates
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {news.length} stories
            </span>
          </div>

          {news.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No current news articles specifically tagged under this sector.
            </div>
          ) : (
            news.map((item) => <NewsCard key={item.id} article={item} />)
          )}
        </div>

        {/* Right: Constituent Stocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Constituent Companies
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {companies.map((comp) => {
              const isPos = (comp.quote?.changePercent ?? 0) >= 0;
              return (
                <Link
                  key={comp.id}
                  href={`/company/${comp.slug}`}
                  className="glass-panel"
                  style={{
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {comp.ticker}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {comp.shortName || comp.name}
                    </span>
                  </div>

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
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
