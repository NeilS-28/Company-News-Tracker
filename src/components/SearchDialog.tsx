'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, TrendingUp, Building2, Layers } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { MarketQuote } from '@/types';

interface SearchItem {
  type: 'company' | 'sector';
  id: number;
  name: string;
  shortName?: string;
  ticker?: string;
  sector?: string;
  slug: string;
  description?: string;
  quote?: MarketQuote | null;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search API fetch with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '5rem 1rem 2rem 1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 640,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={20} color="var(--accent-primary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search companies (e.g. Reliance, TCS, INFY) or sectors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          )}
          <span
            style={{
              fontSize: '0.75rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '0.5rem' }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Searching NSE companies & sectors...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No companies or sectors found for &quot;{query}&quot;
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Type to search any of the 50 NIFTY 50 constituents, industry sectors, or tickers.
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {results.map((item) => {
                if (item.type === 'company') {
                  const isPositive = (item.quote?.changePercent ?? 0) >= 0;
                  return (
                    <Link
                      key={`comp-${item.id}`}
                      href={`/company/${item.slug}`}
                      onClick={onClose}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              {item.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'var(--border-subtle)',
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {item.ticker}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {item.sector}
                          </span>
                        </div>
                      </div>

                      {item.quote && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                            {formatCurrency(item.quote.price)}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-mono)',
                              color: isPositive ? 'var(--bullish)' : 'var(--bearish)',
                            }}
                          >
                            {formatPercent(item.quote.changePercent)}
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                }

                // Sector item
                return (
                  <Link
                    key={`sec-${item.id}`}
                    href={`/sector/${item.slug}`}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <Layers size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {item.name}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Sector Overview
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                      View Sector &rarr;
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
