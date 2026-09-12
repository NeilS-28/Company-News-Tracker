'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketOverview from '@/components/MarketOverview';
import NewsFeed from '@/components/NewsFeed';
import CompanyGrid from '@/components/CompanyGrid';
import { Newspaper, Building2, Layers, Sparkles, TrendingUp, Star, Radar } from 'lucide-react';
import DealRadar from '@/components/DealRadar';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'news' | 'deals' | 'companies' | 'sectors'>('news');

  const tabs = [
    { id: 'news', label: 'News Feed', icon: Newspaper },
    { id: 'deals', label: 'Deal Radar & Rumours', icon: Radar },
    { id: 'companies', label: 'Companies Directory', icon: Building2 },
    { id: 'sectors', label: 'Sectors & Heatmap', icon: Layers },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Section: Live Market Overview */}
      <MarketOverview />

      {/* Main Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: isActive ? '#080c14' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/watchlists"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              color: '#eab308',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Star size={15} fill="currentColor" />
            <span>My Watchlists</span>
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'news' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
            gap: '1.75rem',
          }}
          className="dashboard-grid"
        >
          {/* Main Column: Rich News Stream */}
          <div>
            <NewsFeed title="Market & Company News" />
          </div>

          {/* Right Column: NIFTY 50 At-A-Glance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Companies Directory
                </h3>
                <Link
                  href="/companies"
                  style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  View all 2,500+ &rarr;
                </Link>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track real-time valuations, recent headlines, and corporate actions across Indian listed equities.
              </p>
              <CompanyGrid />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deals' && (
        <div>
          <DealRadar />
        </div>
      )}

      {activeTab === 'companies' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Indian Listed Equities Directory
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Browse and search 2,500+ companies listed on the National Stock Exchange (NSE) &amp; Bombay Stock Exchange (BSE).
            </p>
          </div>
          <CompanyGrid />
        </div>
      )}

      {activeTab === 'sectors' && (
        <SectorsTabOverview />
      )}
    </div>
  );
}

function SectorsTabOverview() {
  const [sectors, setSectors] = useState<Array<{ id: number; name: string; slug: string; description: string; companyCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch('/api/sectors')
      .then(res => res.json())
      .then(json => {
        if (json.success) setSectors(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-panel skeleton" style={{ height: 140 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Indian Stock Market Sectors
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Filter company intelligence, trends, and regulatory updates across key economic sectors.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
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
              gap: '0.75rem',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {sector.name}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                  }}
                >
                  {sector.companyCount} {sector.companyCount === 1 ? 'stock' : 'stocks'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {sector.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              <span>View Sector Intelligence &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
