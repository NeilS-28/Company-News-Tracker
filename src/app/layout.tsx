import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import { AuthProvider } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

export const metadata: Metadata = {
  title: `${APP_NAME} — Indian Stock Market News & NSE / BSE Equities Research`,
  description: APP_DESCRIPTION,
  keywords: ['Indian Stock Market', 'NSE News', 'BSE News', 'NIFTY 50', 'Sensex', 'Stock Tracker', 'Company News India'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <Header />
          <AuthModal />
          <main className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem', minHeight: 'calc(100vh - 140px)' }}>
            {children}
          </main>
        </AuthProvider>
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '2rem 0',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <span>{APP_NAME}</span>
              <span>•</span>
              <span>Indian Stock Market News & Research</span>
            </div>
            <p style={{ maxWidth: 600 }}>
              Market data & news aggregated for research and educational purposes only. Not financial advice. NSE & BSE listed equities data current.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
