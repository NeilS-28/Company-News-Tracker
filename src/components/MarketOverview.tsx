'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { formatPoints, formatPercent, formatRelativeTime } from '@/lib/utils';
import { MarketQuote } from '@/types';

interface MarketData {
  indices: MarketQuote[];
  marketBreadth: {
    advances: number;
    declines: number;
    unchanged: number;
    advanceDeclineRatio: number;
  };
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
  updatedAt: string;
}

export default function MarketOverview() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarket() {
      try {
        const res = await fetch('/api/market');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    loadMarket();
    const interval = setInterval(loadMarket, 45000); // Poll every 45s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel skeleton" style={{ height: 100 }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const totalBreadth = (data.marketBreadth.advances + data.marketBreadth.declines + data.marketBreadth.unchanged) || 50;
  const advancesPct = Math.round((data.marketBreadth.advances / totalBreadth) * 100);

  return (
    <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top indices cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {data.indices.map((idx) => {
          const isPos = idx.change >= 0;
          return (
            <div
              key={idx.symbol}
              className="glass-panel"
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: isPos
                    ? 'linear-gradient(90deg, #10b981 0%, transparent 100%)'
                    : 'linear-gradient(90deg, #f43f5e 0%, transparent 100%)',
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {idx.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    NSE
                  </span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {formatPoints(idx.price)}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isPos ? 'var(--bullish-bg)' : 'var(--bearish-bg)',
                    border: `1px solid ${isPos ? 'var(--bullish-border)' : 'var(--bearish-border)'}`,
                    color: isPos ? 'var(--bullish)' : 'var(--bearish)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{formatPercent(idx.changePercent)}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '0.25rem',
                  }}
                >
                  {isPos ? '+' : ''}{idx.change.toFixed(2)} pts
                </span>
              </div>
            </div>
          );
        })}

        {/* Market Breadth Card */}
        <div
          className="glass-panel"
          style={{
            padding: '1.15rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Market Sentiment & Breadth
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: advancesPct > 50 ? 'var(--bullish)' : 'var(--bearish)',
                padding: '2px 6px',
                borderRadius: '4px',
                background: advancesPct > 50 ? 'var(--bullish-bg)' : 'var(--bearish-bg)',
              }}
            >
              {advancesPct > 50 ? 'Bullish' : 'Bearish'} ({advancesPct}%)
            </span>
          </div>

          <div style={{ margin: '0.6rem 0' }}>
            {/* Visual ratio bar */}
            <div
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                backgroundColor: 'var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: `${advancesPct}%`,
                  backgroundColor: 'var(--bullish)',
                  transition: 'width 0.5s ease',
                }}
              />
              <div
                style={{
                  width: `${100 - advancesPct}%`,
                  backgroundColor: 'var(--bearish)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ color: 'var(--bullish)' }}>
              ▲ {data.marketBreadth.advances} Advances
            </span>
            <span style={{ color: 'var(--bearish)' }}>
              ▼ {data.marketBreadth.declines} Declines
            </span>
          </div>
        </div>
      </div>

      {/* Top Gainers & Losers Ticker Strip */}
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
          {data.gainers.slice(0, 3).map((g) => (
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

          {data.losers.slice(0, 3).map((l) => (
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
    </div>
  );
}
