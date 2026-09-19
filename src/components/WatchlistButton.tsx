'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useAccount } from './AccountProvider';
import { authenticatedFetch } from '@/lib/supabase/browser';

export default function WatchlistButton({
  companyId,
  size = 16,
  showLabel = false,
}: {
  companyId: number;
  size?: number;
  showLabel?: boolean;
}) {
  const {
    user,
    ready,
    configured,
    lists,
    error: listError,
    refreshLists,
  } = useAccount();
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const saved = lists.some((list) =>
    list.companies.some((company) => company.id === companyId),
  );
  async function toggle(id: number, exists: boolean) {
    setBusy(true);
    setError(null);
    try {
      await authenticatedFetch(`/api/watchlists/${id}`, {
        method: 'POST',
        body: JSON.stringify({ companyId, action: exists ? 'remove' : 'add' }),
      });
      await refreshLists();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update watchlist.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        disabled={!ready || !configured}
        aria-label={saved ? 'Manage saved company' : 'Add company to watchlist'}
        title={
          !configured ? 'Watchlists are not available yet' : 'Choose watchlists'
        }
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!user) {
            router.push('/watchlists');
            return;
          }
          dialog.current?.showModal();
        }}
        className="watchlist-star"
        style={{ color: saved ? '#eab308' : 'var(--text-secondary)' }}
      >
        <Star size={size} fill={saved ? 'currentColor' : 'none'} />
        {showLabel && (saved ? 'Saved' : 'Watchlist')}
      </button>
      <dialog
        ref={dialog}
        aria-label="Choose watchlists"
        className="watchlist-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Save to watchlists</h2>
        {(error || listError) && <p role="alert">{error || listError}</p>}
        {lists.length === 0 ? (
          <p>Create your first watchlist to save this company.</p>
        ) : (
          lists.map((list) => {
            const exists = list.companies.some(
              (company) => company.id === companyId,
            );
            return (
              <label className="watchlist-choice" key={list.id}>
                <input
                  type="checkbox"
                  checked={exists}
                  disabled={busy}
                  onChange={() => void toggle(list.id, exists)}
                />
                {list.name}
              </label>
            );
          })
        )}
        <div className="action-row">
          <button
            type="button"
            className="action-button"
            onClick={() => {
              dialog.current?.close();
              router.push('/watchlists');
            }}
          >
            Manage lists
          </button>
          <button
            type="button"
            className="action-button"
            onClick={() => dialog.current?.close()}
          >
            Done
          </button>
        </div>
      </dialog>
    </>
  );
}
