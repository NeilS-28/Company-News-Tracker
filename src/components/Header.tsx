'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Activity, LogOut, Bookmark, ChevronDown } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SearchDialog from './SearchDialog';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, logout, openAuthModal } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
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

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Dashboard', href: '/' },
    { label: 'Companies', href: '/companies' },
    { label: 'Sectors', href: '/sectors' },
    { label: 'Watchlists', href: '/watchlists' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

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
              fontFamily: 'var(--font-display)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'var(--accent-fill)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
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

            {/* Auth section */}
            {!loading && (
              <div style={{ position: 'relative' }} ref={menuRef}>
                {user ? (
                  <div>
                    <button
                      onClick={() => setUserMenuOpen(prev => !prev)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.3rem 0.6rem 0.3rem 0.35rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--accent-fill)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name.split(' ')[0]}
                      </span>
                      <ChevronDown size={14} color="var(--text-muted)" />
                    </button>

                    {userMenuOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 8px)',
                          width: '230px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-lg)',
                          boxShadow: 'var(--shadow-xl)',
                          padding: '0.5rem',
                          zIndex: 200,
                          animation: 'fadeIn 0.15s ease-out',
                        }}
                      >
                        <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.35rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                          </div>
                        </div>

                        <Link
                          href="/watchlists"
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Bookmark size={15} color="var(--accent-primary)" />
                          <span>My Watchlists</span>
                        </Link>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            color: 'var(--bearish)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => openAuthModal('login')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#fff',
                        background: 'var(--accent-fill)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-glow)',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
