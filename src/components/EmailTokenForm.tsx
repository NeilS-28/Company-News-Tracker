'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function EmailTokenForm({ purpose }: { purpose: 'reset' | 'verify' }) {
  const token = useSearchParams().get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(token ? '/api/auth/confirm-email' : '/api/auth/request-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { token, purpose, password } : { email, purpose }),
      });
      const result = await response.json();
      setMessage(result.success ? (token ? 'Done. You can sign in now.' : result.message) : result.error);
    } catch { setMessage('Please try again later.'); }
    setBusy(false);
  }
  return <main style={{ maxWidth: 450, margin: '5rem auto', padding: '2rem', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: 'var(--radius-lg)' }}>
    <h1>{purpose === 'reset' ? 'Reset your password' : 'Verify your email'}</h1>
    <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>{token ? (purpose === 'reset' ? 'Choose a new password to continue.' : 'Confirm your email address.') : 'Enter your email to request a new link.'}</p>
    <form onSubmit={submit} style={{ display: 'grid', gap: '1rem' }}>
      {token ? (purpose === 'reset' ? <input aria-label="New password" type="password" autoComplete="new-password" minLength={10} maxLength={256} required value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (10+ characters)" /> : null)
        : <input aria-label="Email address" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />}
      <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Please wait…' : token ? 'Confirm' : 'Send link'}</button>
    </form>
    {message && <p role="status" style={{ marginTop: '1rem' }}>{message}</p>}
    <p style={{ marginTop: '1.25rem' }}><Link href="/">Back to MarketPulse</Link></p>
  </main>;
}
