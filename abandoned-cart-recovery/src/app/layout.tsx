import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Abandoned Cart Recovery - Intelligent E-commerce Recovery Platform',
  description: 'Automatically re-engage customers who abandon their shopping carts with AI-powered multi-channel campaigns. Recover up to 30% of lost sales with personalized email, SMS, and push notifications.',
  keywords: [
    'abandoned cart recovery',
    'e-commerce automation',
    'cart abandonment',
    'email marketing',
    'SMS marketing',
    'conversion optimization',
    'Shopify recovery',
    'WooCommerce recovery'
  ],
  authors: [{ name: 'Abandoned Cart Recovery Team' }],
  creator: 'Abandoned Cart Recovery',
  publisher: 'Abandoned Cart Recovery',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Abandoned Cart Recovery - Intelligent E-commerce Recovery Platform',
    description: 'Automatically re-engage customers who abandon their shopping carts with AI-powered multi-channel campaigns.',
    siteName: 'Abandoned Cart Recovery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abandoned Cart Recovery - Intelligent E-commerce Recovery Platform',
    description: 'Automatically re-engage customers who abandon their shopping carts with AI-powered multi-channel campaigns.',
    creator: '@abandonedcartapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable
      )}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}