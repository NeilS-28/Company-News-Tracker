'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, ChevronRight, Building2 } from 'lucide-react';
import type { SectorWithCompanies } from '@/types';

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorWithCompanies[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sectors')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSectors(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
          }}
        >
          <Layers size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Indian Market Sectors
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            21 key sectors covering Indian exchange equities and macroeconomic trends
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="glass-panel skeleton" style={{ height: 160 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {sectors.map((sector) => (
            <Link
              key={sector.id}
              href={`/sector/${sector.slug}`}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                textDecoration: 'none',
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
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {sector.name}
                  </h2>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {sector.companyCount} {sector.companyCount === 1 ? 'stock' : 'stocks'}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {sector.description}
                </p>
              </div>

              {/* Sample stock tickers pill preview */}
              {sector.companies && sector.companies.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {sector.companies.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {c.ticker}
                    </span>
                  ))}
                  {sector.companies.length > 4 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      +{sector.companies.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Explore Sector Feed</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
