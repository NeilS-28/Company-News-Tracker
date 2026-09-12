'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface WatchlistButtonProps {
  companyId: number;
  size?: number;
  showLabel?: boolean;
}

export default function WatchlistButton({ companyId, size = 16, showLabel = false }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check local storage / watchlist state
    const saved = localStorage.getItem('marketpulse-watchlist');
    if (saved) {
      try {
        const ids: number[] = JSON.parse(saved);
        setIsInWatchlist(ids.includes(companyId));
      } catch {
        // Ignore
      }
    }
  }, [companyId]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    const saved = localStorage.getItem('marketpulse-watchlist');
    let ids: number[] = [];
    if (saved) {
      try {
        ids = JSON.parse(saved);
      } catch {
        ids = [];
      }
    }

    const exists = ids.includes(companyId);
    let nextIds: number[];

    if (exists) {
      nextIds = ids.filter(id => id !== companyId);
      setIsInWatchlist(false);
    } else {
      nextIds = [...ids, companyId];
      setIsInWatchlist(true);
    }

    localStorage.setItem('marketpulse-watchlist', JSON.stringify(nextIds));

    // Also sync with server watchlist #1 in background
    try {
      await fetch('/api/watchlists/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: exists ? 'remove' : 'add',
          companyId,
        }),
      });
    } catch {
      // Offline / server fallback ok
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: showLabel ? '0.35rem 0.65rem' : '0.35rem',
        borderRadius: 'var(--radius-sm)',
        background: isInWatchlist ? 'rgba(234, 179, 8, 0.12)' : 'transparent',
        border: `1px solid ${isInWatchlist ? 'rgba(234, 179, 8, 0.3)' : 'transparent'}`,
        color: isInWatchlist ? '#eab308' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isInWatchlist) {
          e.currentTarget.style.color = '#eab308';
          e.currentTarget.style.background = 'rgba(234, 179, 8, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isInWatchlist) {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <Star
        size={size}
        fill={isInWatchlist ? '#eab308' : 'none'}
        stroke={isInWatchlist ? '#eab308' : 'currentColor'}
      />
      {showLabel && (
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {isInWatchlist ? 'Watchlisted' : 'Watchlist'}
        </span>
      )}
    </button>
  );
}
