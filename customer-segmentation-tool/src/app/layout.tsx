import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Customer Segmentation Tool - AI-Powered Marketing Analytics',
  description: 'Advanced customer segmentation and targeting platform with machine learning capabilities for personalized marketing campaigns.',
  keywords: [
    'customer segmentation',
    'marketing analytics',
    'machine learning',
    'behavioral analytics',
    'RFM analysis',
    'predictive analytics',
    'marketing automation'
  ],
  authors: [{ name: 'Customer Segmentation Tool Team' }],
  creator: 'Customer Segmentation Tool',
  openGraph: {
    title: 'Customer Segmentation Tool - AI-Powered Marketing Analytics',
    description: 'Advanced customer segmentation and targeting platform with machine learning capabilities.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Segmentation Tool',
    description: 'AI-powered customer segmentation for smarter marketing',
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
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}