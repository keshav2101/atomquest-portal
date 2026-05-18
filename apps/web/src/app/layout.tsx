// ============================================================
// Root Layout — AtomQuest Portal
// ============================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | AtomQuest Portal',
    default: 'AtomQuest — Goal & Performance Tracking',
  },
  description:
    'Enterprise Goal Setting & Performance Tracking Portal by Atomberg. Set, track, and achieve your goals with intelligent workflows and real-time analytics.',
  keywords: ['goal setting', 'performance tracking', 'OKR', 'KPI', 'HR portal', 'Atomberg'],
  authors: [{ name: 'Atomberg Technologies' }],
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: 'AtomQuest — Goal & Performance Portal',
    description: 'Enterprise-grade goal tracking for modern teams.',
    siteName: 'AtomQuest Portal',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            expand
            duration={4000}
            toastOptions={{
              style: { borderRadius: '12px' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
