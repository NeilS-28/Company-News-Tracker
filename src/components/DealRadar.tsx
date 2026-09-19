'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Radar, ExternalLink, CheckCircle2, XCircle, AlertCircle, HelpCircle, FileText, Globe } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DealRadarItem, DealStatus } from '@/types';

interface DealRadarProps {
  companyId?: number;
  companyName?: string;
  irUrl?: string;
}

export default function DealRadar({ companyId, companyName, irUrl }: DealRadarProps) {
  const [deals, setDeals] = useState<DealRadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DealStatus | 'all'>('all');
  const [companyIR, setCompanyIR] = useState<{ irUrl: string; pressReleaseUrl?: string } | null>(null);

  const requestRef = useRef<AbortController | null>(null);
  const loadDeals = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (companyId) params.set('companyId', String(companyId));

      const res = await fetch(`/api/deals?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error('Deal news is temporarily unavailable. Please retry.');
      if (json.success && !controller.signal.aborted) {
        setError(null);
        setDeals(json.data);
        if (json.irInfo) setCompanyIR(json.irInfo);
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load deals.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [filter, companyId]);

  useEffect(() => {
    const timer = setTimeout(() => void loadDeals(), 250);
    return () => { clearTimeout(timer); requestRef.current?.abort(); };
  }, [loadDeals]);

  const getStatusBadge = (status: DealStatus) => {
    switch (status) {
      case 'unverified-rumour':
        return {
          label: 'Unverified Rumour',
          bg: 'rgba(234, 179, 8, 0.12)',
          border: 'rgba(234, 179, 8, 0.3)',
          text: '#eab308',
          icon: HelpCircle,
        };
      case 'reported-talks':
        return {
          label: 'Reported Talks',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.3)',
          text: '#38bdf8',
          icon: AlertCircle,
        };
      case 'reported-clarification':
        return {
          label: 'Reported Clarification',
          bg: 'rgba(168, 85, 247, 0.12)',
          border: 'rgba(168, 85, 247, 0.3)',
          text: '#c084fc',
          icon: FileText,
        };
      case 'reported-agreement':
        return {
          label: 'Reported Agreement',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#10b981',
          icon: CheckCircle2,
        };
      case 'reported-denial':
        return {
          label: 'Reported Denial',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#ef4444',
          icon: XCircle,
        };
    }
  };

  const statusFilters = [
    { id: 'all', label: 'All Buzz & Deals' },
    { id: 'unverified-rumour', label: '🟡 Rumours' },
    { id: 'reported-talks', label: '🔵 In Talks' },
    { id: 'reported-clarification', label: '🟣 Reported Clarifications' },
    { id: 'reported-agreement', label: '🟢 Reported Agreements' },
    { id: 'reported-denial', label: '🔴 Denied' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && <p role="alert" className="error-message">{error} <button className="action-button" onClick={() => void loadDeals()}>Retry</button></p>}
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid var(--accent-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Radar size={22} className="live-indicator" style={{ background: 'transparent' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Deal Radar & Market Rumours</span>
              {companyName && <span style={{ color: 'var(--accent-primary)' }}>• {companyName}</span>}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Automated labels from news headlines, not independently verified filings. Open the source and check official company disclosures.
            </p>
          </div>
        </div>

        {/* Official IR Portal Link if present */}
        {(companyIR || irUrl) && (
          <a
            href={companyIR?.irUrl || irUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--accent-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Globe size={14} />
            <span>Official Investor Relations</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          scrollbarWidth: 'none',
        }}
      >
        {statusFilters.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { if (filter !== tab.id) { setLoading(true); setDeals([]); setFilter(tab.id as DealStatus | 'all'); } }}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: isActive ? '#080c14' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'transparent' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-panel skeleton" style={{ height: 120 }} />
          ))
        ) : deals.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            No deals or rumours matching the selected criteria.
          </div>
        ) : (
          deals.map((item) => {
            const badge = getStatusBadge(item.dealStatus);
            const Icon = badge.icon;

            return (
              <article
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  position: 'relative',
                  borderLeft: `3px solid ${badge.text}`,
                }}
              >
                {/* Meta header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      <Icon size={12} />
                      <span>{badge.label}</span>
                    </span>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.source} • <span style={{ fontFamily: 'var(--font-mono)' }}>{formatDate(item.publishedAt)}</span>
                    </span>
                  </div>

                  {item.sourceConfidence && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      Automated · unverified
                    </span>
                  )}
                </div>

                {/* Headline */}
                <div>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      lineHeight: 1.4,
                      display: 'inline-flex',
                      alignItems: 'flex-start',
                      gap: '0.35rem',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  >
                    <span>{item.title}</span>
                    <ExternalLink size={14} style={{ marginTop: 4, flexShrink: 0, opacity: 0.6 }} />
                  </a>
                </div>

                {/* Summary */}
                {item.summary && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {item.summary}
                  </p>
                )}

                {/* Tags if available */}
                {item.companies && item.companies.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                    {item.companies.map((c) => (
                      <Link
                        key={c.id}
                        href={`/company/${c.slug}`}
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.08)',
                          color: 'var(--accent-primary)',
                          textDecoration: 'none',
                        }}
                      >
                        {c.ticker}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
