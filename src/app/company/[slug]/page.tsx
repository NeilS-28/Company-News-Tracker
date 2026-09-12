'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
  Globe,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatPercent, formatPoints } from '@/lib/utils';
import { CompanyWithQuote, NewsArticleWithRelations } from '@/types';
import WatchlistButton from '@/components/WatchlistButton';
import NewsCard from '@/components/NewsCard';
import DealRadar from '@/components/DealRadar';
import { COMPANY_IR_PORTALS } from '@/lib/providers/deals';

interface CompanyData {
  company: CompanyWithQuote;
  quote: {
    price: number;
    change: number;
    changePercent: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    previousClose: number;
    volume: number;
  };
  news: NewsArticleWithRelations[];
  peers: CompanyWithQuote[];
}

export default function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'news' | 'deals'>('news');

  useEffect(() => {
    fetch(`/api/companies/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Company not found');
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load company');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel skeleton" style={{ height: 180 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
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
          {error || 'Company not found'}
        </h2>
        <Link href="/companies" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
          &larr; Back to all companies
        </Link>
      </div>
    );
  }

  const { company, quote, news, peers } = data;
  const isPos = (quote?.changePercent ?? 0) >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/companies"
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
          <span>Back to NIFTY 50 Directory</span>
        </Link>
      </div>

      {/* Company Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ flex: '1 1 340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              {company.ticker}.NS
            </span>
            {company.isNifty50 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                NIFTY 50
              </span>
            )}
            <WatchlistButton companyId={company.id} showLabel size={15} />
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {company.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Link
              href={`/sector/${company.sectorSlug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.85rem',
                color: 'var(--accent-primary)',
                textDecoration: 'none',
              }}
            >
              <Layers size={14} />
              <span>{company.sector}</span>
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {company.industry}
            </span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {company.description}
          </p>

          {COMPANY_IR_PORTALS[company.ticker] && (
            <div style={{ marginTop: '0.75rem' }}>
              <a
                href={COMPANY_IR_PORTALS[company.ticker].irUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  textDecoration: 'none',
                }}
              >
                <Globe size={13} />
                <span>Official Investor Relations & Press Releases</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Live Quote Box */}
        {quote && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              minWidth: 260,
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              NSE Real-Time / Last Close
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(quote.price)}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: isPos ? 'var(--bullish)' : 'var(--bearish)',
                }}
              >
                {isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{formatPercent(quote.changePercent)}</span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Day High</span>
                <span style={{ fontWeight: 600 }}>{formatPoints(quote.dayHigh)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Day Low</span>
                <span style={{ fontWeight: 600 }}>{formatPoints(quote.dayLow)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Prev Close</span>
                <span style={{ fontWeight: 600 }}>{formatPoints(quote.previousClose)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Volume</span>
                <span style={{ fontWeight: 600 }}>{quote.volume.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid: Left = News / Deals, Right = Peers & Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.75rem' }}>
        {/* Left: News or Deal Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Subtabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveSubTab('news')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: activeSubTab === 'news' ? 700 : 500,
                background: activeSubTab === 'news' ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: activeSubTab === 'news' ? '#080c14' : 'var(--text-secondary)',
                border: `1px solid ${activeSubTab === 'news' ? 'transparent' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
            >
              All News & Filings ({news.length})
            </button>
            <button
              onClick={() => setActiveSubTab('deals')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: activeSubTab === 'deals' ? 700 : 500,
                background: activeSubTab === 'deals' ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: activeSubTab === 'deals' ? '#080c14' : 'var(--text-secondary)',
                border: `1px solid ${activeSubTab === 'deals' ? 'transparent' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
            >
              Deal Radar & Rumours
            </button>
          </div>

          {activeSubTab === 'news' ? (
            news.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent news articles found for this company.
              </div>
            ) : (
              news.map((item) => <NewsCard key={item.id} article={item} />)
            )
          ) : (
            <DealRadar companyId={company.id} companyName={company.shortName || company.name} irUrl={COMPANY_IR_PORTALS[company.ticker]?.irUrl} />
          )}
        </div>

        {/* Right: Peers & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sector Peers Card */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
              Peers in {company.sector}
            </h3>

            {peers.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No other NIFTY 50 peers in this sector.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {peers.map((peer) => (
                  <Link
                    key={peer.id}
                    href={`/company/${peer.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'block' }}>
                        {peer.shortName || peer.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {peer.ticker}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      View &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Research Disclaimer */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Research Notice
            </span>
            Headlines and announcements are synced from public RSS feeds and NSE disclosures. Quotes are indicative and updated at scheduled intervals.
          </div>
        </div>
      </div>
    </div>
  );
}
