import CompanyGrid from '@/components/CompanyGrid';
import { Building2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indian Listed Companies Directory — MarketPulse',
  description: 'Explore 5,100+ listed equities across the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE) with real-time quotes, sector categorization, and latest news.',
};

export default function CompaniesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
          }}
        >
          <Building2 size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Indian Listed Companies
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            5,100+ equities listed on the National Stock Exchange (NSE) &amp; Bombay Stock Exchange (BSE)
          </p>
        </div>
      </div>

      <CompanyGrid />
    </div>
  );
}
