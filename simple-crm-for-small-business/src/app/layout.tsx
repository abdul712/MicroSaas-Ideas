import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Simple CRM - Customer Relationship Management for Small Business',
  description: 'A streamlined, user-friendly CRM platform designed specifically for small businesses and startups with comprehensive contact management, sales pipeline, and communication features.',
  keywords: 'CRM, customer relationship management, small business, sales pipeline, contact management, lead tracking',
  authors: [{ name: 'Simple CRM' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://simple-crm.com',
    title: 'Simple CRM - Customer Relationship Management for Small Business',
    description: 'Manage your customers in minutes, not hours. Simple CRM gives you everything you need to track customers, deals, and communications without the complexity of enterprise software.',
    siteName: 'Simple CRM',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simple CRM - Customer Relationship Management for Small Business',
    description: 'Manage your customers in minutes, not hours. Simple CRM gives you everything you need to track customers, deals, and communications without the complexity of enterprise software.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Security headers via meta tags (fallback) */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}