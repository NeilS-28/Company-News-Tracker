'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Bookmark, Building2, Layers } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { NewsArticleWithRelations } from '@/types';

interface NewsCardProps {
  article: NewsArticleWithRelations;
}

export default function NewsCard({ article }: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const bmarks = JSON.parse(localStorage.getItem('mp-bookmarks') || '[]');
      const reads = JSON.parse(localStorage.getItem('mp-reads') || '[]');
      const inBmarks = bmarks.includes(article.id);
      const inReads = reads.includes(article.id);

      queueMicrotask(() => {
        setIsBookmarked(inBmarks);
        setIsRead(inReads);
      });
    } catch {
      // Ignore
    }
  }, [article.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const bmarks: number[] = JSON.parse(localStorage.getItem('mp-bookmarks') || '[]');
      const next = bmarks.includes(article.id)
        ? bmarks.filter(id => id !== article.id)
        : [...bmarks, article.id];
      setIsBookmarked(!isBookmarked);
      localStorage.setItem('mp-bookmarks', JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const markAsRead = () => {
    try {
      const reads: number[] = JSON.parse(localStorage.getItem('mp-reads') || '[]');
      if (!reads.includes(article.id)) {
        reads.push(article.id);
        setIsRead(true);
        localStorage.setItem('mp-reads', JSON.stringify(reads));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <article
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        opacity: isRead ? 0.75 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Meta Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            {article.source}
          </span>
          <span>•</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            {formatDate(article.publishedAt)}
          </span>

          {article.category && (
            <>
              <span>•</span>
              <span
                style={{
                  textTransform: 'capitalize',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'var(--neutral-badge-bg)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                {article.category.replace('-', ' ')}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            title={isBookmarked ? 'Bookmarked' : 'Bookmark article'}
            style={{
              color: isBookmarked ? 'var(--accent-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Headline & External Link */}
      <div>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={markAsRead}
          style={{
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '1.05rem',
            fontWeight: 600,
            lineHeight: 1.4,
            display: 'inline-flex',
            alignItems: 'flex-start',
            gap: '0.35rem',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        >
          <span>{article.title}</span>
          <ExternalLink size={14} style={{ marginTop: 4, flexShrink: 0, opacity: 0.6 }} />
        </a>
      </div>

      {/* Summary */}
      {article.summary && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {article.summary}
        </p>
      )}

      {/* Companies & Sectors Tags */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexWrap: 'wrap',
          paddingTop: '0.25rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {article.companies && article.companies.map((comp) => (
          <Link
            key={comp.id}
            href={`/company/${comp.slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent-primary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Building2 size={12} />
            <span>{comp.ticker || comp.name}</span>
          </Link>
        ))}

        {article.sectors && article.sectors.map((sec) => (
          <Link
            key={sec.id}
            href={`/sector/${sec.slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textDecoration: 'none',
            }}
          >
            <Layers size={12} />
            <span>{sec.name}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}
