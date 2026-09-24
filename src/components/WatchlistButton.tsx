'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface WatchlistButtonProps {
  companyId: number;
  size?: number;
  showLabel?: boolean;
}

export default function WatchlistButton({ companyId, size = 16, showLabel = false }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = user ? `marketpulse-watchlist-${user.id}` : 'marketpulse-watchlist';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const ids: number[] = JSON.parse(saved);
        const inList = ids.includes(companyId);
        queueMicrotask(() => setIsInWatchlist(inList));
      } catch {
        // Ignore
      }
    }
  }, [companyId, user]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    const storageKey = user ? `marketpulse-watchlist-${user.id}` : 'marketpulse-watchlist';
    const saved = localStorage.getItem(storageKey);
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
      nextIds = ids.filter((id) => id !== companyId);
      setIsInWatchlist(false);
    } else {
      nextIds = [...ids, companyId];
      setIsInWatchlist(true);
    }

    localStorage.setItem(storageKey, JSON.stringify(nextIds));

    // Also sync with server user/default watchlist
    try {
      // Find active watchlist ID
      const wlRes = await fetch('/api/watchlists');
      const wlJson = await wlRes.json();
      const targetId = wlJson.data?.[0]?.id || 1;

      await fetch(`/api/watchlists/${targetId}`, {
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
        background: isInWatchlist ? 'var(--accent-soft)' : 'transparent',
        border: `1px solid ${isInWatchlist ? 'var(--accent-border)' : 'transparent'}`,
        color: isInWatchlist ? 'var(--accent-primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isInWatchlist) {
          e.currentTarget.style.color = 'var(--accent-primary)';
          e.currentTarget.style.background = 'var(--accent-soft)';
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
        fill={isInWatchlist ? 'var(--accent-primary)' : 'none'}
        stroke={isInWatchlist ? 'var(--accent-primary)' : 'currentColor'}
      />
      {showLabel && (
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {isInWatchlist ? 'Watchlisted' : 'Watchlist'}
        </span>
      )}
    </button>
  );
}
