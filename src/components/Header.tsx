'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Activity } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SearchDialog from './SearchDialog';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Dashboard', href: '/' },
    { label: 'Companies', href: '/companies' },
    { label: 'Sectors', href: '/sectors' },
    { label: 'Watchlists', href: '/watchlists' },
  ];

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'var(--bg-glass)',
          borderBottom: '1px solid var(--border-subtle)',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            gap: '1.5rem',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>Market</span>
              <span style={{ color: 'var(--accent-primary)' }}>Pulse</span>
              <span className="live-indicator" style={{ marginLeft: 2 }} title="Live Market Feed Active" />
            </div>
          </Link>

          {/* Search Bar Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '0.45rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              maxWidth: 380,
              width: '100%',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={15} color="var(--accent-primary)" />
              <span>Search companies, tickers, sectors...</span>
            </div>
            <kbd
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Links & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div
              style={{
                width: 1,
                height: 24,
                backgroundColor: 'var(--border-subtle)',
              }}
            />

            <ThemeToggle />
          </div>
        </div>
      </header>

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
