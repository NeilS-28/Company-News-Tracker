'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Building2, Layers } from 'lucide-react';
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
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((item: SearchItem) => {
    handleClose();
    if (item.type === 'company') {
      router.push(`/company/${item.slug}`);
    } else {
      router.push(`/sector/${item.slug}`);
    }
  }, [handleClose, router]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation & escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, results, selectedIndex, handleSelect]);

  // Search API fetch with debounce
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
          setSelectedIndex(json.data.length > 0 ? 0 : -1);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setSelectedIndex(-1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
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
            placeholder="Search 2,500+ NSE & BSE companies, tickers (e.g. RELIANCE, ZOMATO, TRENT), sectors..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
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
              onClick={() => handleQueryChange('')}
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
        <div role="listbox" style={{ maxHeight: 380, overflowY: 'auto', padding: '0.5rem' }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Searching Indian equities & sectors...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No companies or sectors found for &quot;{query}&quot;
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Type to search 2,500+ NSE & BSE listed equities, industry sectors, or tickers.
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                if (item.type === 'company') {
                  const isPositive = (item.quote?.changePercent ?? 0) >= 0;
                  return (
                    <div
                      key={`comp-${item.id}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
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
                    </div>
                  );
                }

                // Sector item
                return (
                  <div
                    key={`sec-${item.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
