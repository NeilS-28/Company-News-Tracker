'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Newspaper, ChevronRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { CompanyWithQuote } from '@/types';
import WatchlistButton from './WatchlistButton';

interface CompanyCardProps {
  company: CompanyWithQuote;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const quote = company.quote;
  const isPos = (quote?.changePercent ?? 0) >= 0;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.85rem',
        position: 'relative',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--border-medium)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Card Header: Ticker, Sector, Watchlist */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <Link
              href={`/company/${company.slug}`}
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
            >
              {company.ticker}
            </Link>
            {company.isNifty50 ? (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                NIFTY 50
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'var(--bg-glass)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                NSE / BSE
              </span>
            )}

            {/* Quote Status Badge */}
            {quote?.status && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: quote.status === 'live' ? 'rgba(34, 197, 94, 0.12)' : 'var(--border-subtle)',
                  color: quote.status === 'live' ? '#22c55e' : 'var(--text-muted)',
                }}
                title={quote.source ? `Data source: ${quote.source}` : undefined}
              >
                {quote.status === 'live' ? '● LIVE' : 'BASE'}
              </span>
            )}
          </div>
          <Link
            href={`/company/${company.slug}`}
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'block',
              lineHeight: 1.3,
            }}
          >
            {company.shortName || company.name}
          </Link>
        </div>

        <WatchlistButton companyId={company.id} />
      </div>

      {/* Quote & Sector Row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Link
            href={`/sector/${company.sectorSlug}`}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {company.sector}
          </Link>
        </div>

        {quote ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
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
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quote unavailable</div>
        )}
      </div>

      {/* Latest Headline or News count */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.65rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Newspaper size={13} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company.latestHeadline || `${company.recentNewsCount ?? 0} news items`}
          </span>
        </div>

        <Link
          href={`/company/${company.slug}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 600,
            flexShrink: 0,
            marginLeft: '0.5rem',
          }}
        >
          <span>Research</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
