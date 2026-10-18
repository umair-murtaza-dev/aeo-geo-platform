import { SiteHeader } from '@/components/site-header';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'AEO Platform',
  description: 'Multi-tenant foundation for AI search visibility operations.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto min-h-[70vh] max-w-5xl px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
