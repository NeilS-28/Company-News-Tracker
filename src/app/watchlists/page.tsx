'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/AccountProvider';
import { authenticatedFetch, getBrowserClient } from '@/lib/supabase/browser';
import CompanyCard from '@/components/CompanyCard';
import NewsCard from '@/components/NewsCard';
import type { CompanyWithQuote, NewsArticleWithRelations } from '@/types';

interface ListData {
  watchlist: { id: number; name: string };
  companies: CompanyWithQuote[];
  news: NewsArticleWithRelations[];
  newsWarning: string | null;
}
export default function WatchlistsPage() {
  const {
    user,
    ready,
    configured,
    lists,
    error: listError,
    refreshLists,
  } = useAccount();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [data, setData] = useState<ListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const active = lists.find((list) => list.id === selected) ?? lists[0];
  const activeId = active?.id;
  const membership = active?.companies.map((c) => c.id).join(',');
  useEffect(() => {
    if (!user?.id || !activeId) return;
    const controller = new AbortController();
    authenticatedFetch(`/api/watchlists/${activeId}`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value);
          setError(null);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.id, activeId, membership, revision]);
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      const { error } = await getBrowserClient()!.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/watchlists` },
      });
      if (error) throw error;
      setNotice('Check your email for a sign-in link.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to send sign-in email.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function createList(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const list = await authenticatedFetch('/api/watchlists', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setName('');
      setSelected(list.id);
      await refreshLists();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create watchlist.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function deleteList() {
    if (!activeId) return;
    setBusy(true);
    setError(null);
    try {
      await authenticatedFetch(`/api/watchlists/${activeId}`, {
        method: 'DELETE',
      });
      setSelected(null);
      setData(null);
      await refreshLists();
      deleteDialog.current?.close();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete watchlist.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <h1>Your watchlists</h1>
      <p>
        Follow companies and read their latest news. Your lists are private to
        your account.
      </p>
      {!ready ? (
        <p role="status">Loading account…</p>
      ) : !configured ? (
        <p role="status">
          Watchlists are not available yet. You can still browse companies and
          news.
        </p>
      ) : !user ? (
        <form className="glass-panel account-form stack" onSubmit={signIn}>
          <h2>Sign in with email</h2>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="action-button" disabled={busy}>
            Send sign-in link
          </button>
        </form>
      ) : (
        <>
          <div className="action-row">
            <span>Signed in as {user.email}</span>
            <button
              className="action-button"
              onClick={async () => {
                const result = await getBrowserClient()!.auth.signOut();
                if (result.error) setError(result.error.message);
                else {
                  setData(null);
                  setNotice('');
                }
              }}
            >
              Sign out
            </button>
          </div>
          <form onSubmit={createList} className="action-row">
            <label htmlFor="list-name">New watchlist</label>
            <input
              id="list-name"
              maxLength={80}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Banking stocks"
            />
            <button className="action-button" disabled={busy}>
              Create
            </button>
          </form>
          <div className="action-row">
            {lists.map((list) => (
              <button
                className="action-button"
                aria-pressed={list.id === activeId}
                key={list.id}
                onClick={() => setSelected(list.id)}
              >
                {list.name} ({list.companyCount})
              </button>
            ))}
          </div>
          {activeId && (
            <div className="action-row">
              <button
                className="action-button"
                disabled={busy}
                onClick={() => deleteDialog.current?.showModal()}
              >
                Delete {active?.name}
              </button>
              <button
                className="action-button"
                disabled={loading}
                onClick={() => {
                  void refreshLists();
                  setRevision((v) => v + 1);
                }}
              >
                Refresh
              </button>
            </div>
          )}
          {loading ? (
            <p role="status">Loading your companies and news…</p>
          ) : data && data.watchlist.id === activeId ? (
            <>
              {data.newsWarning && <p role="status">{data.newsWarning}</p>}
              <div className="research-grid">
                <section className="stack">
                  <h2>News</h2>
                  {data.news.length ? (
                    data.news.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))
                  ) : (
                    <p>No recent stories found.</p>
                  )}
                </section>
                <section className="stack">
                  <h2>Companies</h2>
                  {data.companies.map((company) => (
                    <CompanyCard company={company} key={company.id} />
                  ))}
                  {!data.companies.length && (
                    <p>Use the star on a company to add it to this list.</p>
                  )}
                </section>
              </div>
            </>
          ) : !activeId && !listError ? (
            <p>
              Create a watchlist, then add companies using their star buttons.
            </p>
          ) : null}
          <Link href="/companies">Browse companies →</Link>
          <dialog
            ref={deleteDialog}
            className="watchlist-dialog"
            aria-label="Delete watchlist"
          >
            <h2>Delete {active?.name}?</h2>
            <p>This removes the list and its saved companies.</p>
            <div className="action-row">
              <button
                className="action-button"
                disabled={busy}
                onClick={() => void deleteList()}
              >
                Delete list
              </button>
              <button
                className="action-button"
                onClick={() => deleteDialog.current?.close()}
              >
                Cancel
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </dialog>
        </>
      )}
      {(error || listError) && (
        <p role="alert" className="error-message">
          {error || listError}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
