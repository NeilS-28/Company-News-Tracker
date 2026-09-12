'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { CompanyWithQuote } from '@/types';
import CompanyCard from './CompanyCard';

interface CompanyGridProps {
  initialCompanies?: CompanyWithQuote[];
}

export default function CompanyGrid({ initialCompanies }: CompanyGridProps) {
  const [companies, setCompanies] = useState<CompanyWithQuote[]>(initialCompanies || []);
  const [loading, setLoading] = useState(!initialCompanies);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [sort, setSort] = useState<'name' | 'change' | 'news'>('name');
  const [sectorsList, setSectorsList] = useState<Array<{ slug: string; name: string }>>([]);

  // Fetch available sectors
  useEffect(() => {
    fetch('/api/sectors')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setSectorsList(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch companies with filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sector !== 'all') params.set('sector', sector);
    if (search.trim()) params.set('search', search.trim());
    params.set('sort', sort);

    fetch(`/api/companies?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setCompanies(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sector, search, sort]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.75rem',
            flex: 1,
            minWidth: 200,
          }}
        >
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter companies (e.g. Reliance, HDFC, Tata)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              width: '100%',
            }}
          />
        </div>

        {/* Sector Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Sectors ({sectorsList.length})</option>
            {sectorsList.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={15} color="var(--text-muted)" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'name' | 'change' | 'news')}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="change">Sort: % Gainers First</option>
            <option value="news">Sort: Most News First</option>
          </select>
        </div>
      </div>

      {/* Grid of Companies */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="glass-panel skeleton" style={{ height: 160 }} />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          No companies found matching your criteria.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
