'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CompanyWithQuote } from '@/types';
import CompanyCard from './CompanyCard';

interface CompanyGridProps {
  initialCompanies?: CompanyWithQuote[];
}

export default function CompanyGrid({ initialCompanies }: CompanyGridProps) {
  const [companies, setCompanies] = useState<CompanyWithQuote[]>(initialCompanies || []);
  const [loading, setLoading] = useState(!initialCompanies);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [filter, setFilter] = useState<'all' | 'nifty50'>('all');
  const [sort, setSort] = useState<'name' | 'ticker' | 'news'>('name');
  const [sectorsList, setSectorsList] = useState<Array<{ slug: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialCompanies?.length || 0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter or sort change
  const handleSectorChange = (s: string) => {
    setSector(s);
    setPage(1);
  };

  const handleFilterChange = (f: 'all' | 'nifty50') => {
    setFilter(f);
    setPage(1);
  };

  const handleSortChange = (s: 'name' | 'ticker' | 'news') => {
    setSort(s);
    setPage(1);
  };

  // Fetch available sectors
  useEffect(() => {
    let isMounted = true;
    fetch('/api/sectors')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setSectorsList(json.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch companies with pagination & filters
  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams();
    if (sector !== 'all') params.set('sector', sector);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (filter === 'nifty50') params.set('filter', 'nifty50');
    params.set('sort', sort);
    params.set('page', page.toString());
    params.set('limit', '24');

    fetch(`/api/companies?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setCompanies(json.data);
          setTotalPages(json.totalPages || 1);
          setTotalCount(json.total || 0);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sector, debouncedSearch, filter, sort, page]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            minWidth: 220,
          }}
        >
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search 5,100+ companies or tickers (e.g. RELIANCE, ZOMATO, TRENT)..."
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

        {/* Filter Pills: All vs NIFTY 50 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => handleFilterChange('all')}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: filter === 'all' ? 'var(--accent-fill)' : 'transparent',
              color: filter === 'all' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All Equities
          </button>
          <button
            onClick={() => handleFilterChange('nifty50')}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: filter === 'nifty50' ? 'var(--accent-fill)' : 'transparent',
              color: filter === 'nifty50' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            NIFTY 50
          </button>
        </div>

        {/* Sector Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={sector}
            onChange={(e) => handleSectorChange(e.target.value)}
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
            onChange={(e) => handleSortChange(e.target.value as 'name' | 'ticker' | 'news')}
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
            <option value="name">Sort: Default (NIFTY 50 + A-Z)</option>
            <option value="ticker">Sort: Ticker (A-Z)</option>
            <option value="news">Sort: Most News First</option>
          </select>
        </div>
      </div>

      {/* Results Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
        <span>
          Showing {totalCount > 0 ? (page - 1) * 24 + 1 : 0} &ndash; {Math.min(page * 24, totalCount)} of {totalCount.toLocaleString()} companies
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </span>
        {totalPages > 1 && (
          <span>Page {page} of {totalPages}</span>
        )}
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
          {Array.from({ length: 12 }).map((_, i) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              background: page === 1 ? 'transparent' : 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong></span>
          </div>

          <button
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              background: page >= totalPages ? 'transparent' : 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              opacity: page >= totalPages ? 0.5 : 1,
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
