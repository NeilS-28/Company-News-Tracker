'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'dark');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('marketpulse-theme', next); } catch { /* Storage unavailable. */ }
    window.dispatchEvent(new Event('marketpulse-theme'));
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle light/dark theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function readTheme(): 'dark' | 'light' {
  try { const saved = localStorage.getItem('marketpulse-theme'); if (saved === 'dark' || saved === 'light') return saved; } catch { /* Use system preference. */ }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
function subscribeTheme(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: light)');
  media.addEventListener('change', callback); window.addEventListener('storage', callback); window.addEventListener('marketpulse-theme', callback);
  return () => { media.removeEventListener('change', callback); window.removeEventListener('storage', callback); window.removeEventListener('marketpulse-theme', callback); };
}
