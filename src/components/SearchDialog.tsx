'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { MarketQuote } from '@/types';
import QuoteStatus from './QuoteStatus';
interface SearchItem {
  type: 'company' | 'sector';
  id: number;
  name: string;
  ticker?: string;
  sector?: string;
  slug: string;
  quote?: MarketQuote | null;
}
export default function SearchDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      dialog.current?.showModal();
      input.current?.focus();
    } else dialog.current?.close();
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || !query.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error('Search is unavailable. Please try again.');
        if (!controller.signal.aborted) setResults(json.data);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);
  function close() {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
    onClose();
  }
  return (
    <dialog
      ref={dialog}
      className="watchlist-dialog search-dialog"
      aria-labelledby="search-heading"
      onCancel={close}
      onClose={close}
    >
      <div className="action-row" style={{ justifyContent: 'space-between' }}>
        <h2 id="search-heading">Search companies & sectors</h2>
        <button
          type="button"
          aria-label="Close search"
          className="action-button"
          onClick={close}
        >
          <X size={18} />
        </button>
      </div>
      <label htmlFor="company-search">Company name, ticker, or sector</label>
      <input
        ref={input}
        id="company-search"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setResults([]);
          setError(null);
          setLoading(Boolean(e.target.value.trim()));
        }}
        placeholder="e.g. HDFC Bank"
        style={{
          width: '100%',
          padding: '.75rem',
          marginBlock: '.75rem',
          color: 'var(--text-primary)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-medium)',
        }}
      />
      <div role="status" aria-live="polite">
        {loading
          ? 'Searching…'
          : query && !error
            ? `${results.length} results`
            : 'Search Indian companies and sectors.'}
      </div>
      {error && <p role="alert">{error}</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {results.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              className="search-result"
              href={`/${item.type}/${item.slug}`}
              onClick={close}
            >
              <span>
                <strong>{item.name}</strong>
                <br />
                <small>
                  {item.ticker || 'Sector'} {item.sector && `· ${item.sector}`}
                </small>
              </span>
              {item.quote && (
                <span>
                  {formatCurrency(item.quote.price)}
                  <QuoteStatus quote={item.quote} />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
