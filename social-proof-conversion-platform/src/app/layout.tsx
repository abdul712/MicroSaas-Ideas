import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Social Proof Widget - Conversion Optimization Platform',
  description: 'Boost your website conversions with real-time social proof notifications. Show customer activity, reviews, and social signals to build trust and drive sales.',
  keywords: 'social proof, conversion optimization, website widgets, customer reviews, real-time notifications',
  authors: [{ name: 'Social Proof Team' }],
  creator: 'Social Proof Platform',
  publisher: 'Social Proof Platform',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://socialproof.com',
    siteName: 'Social Proof Platform',
    title: 'Social Proof Widget - Conversion Optimization Platform',
    description: 'Boost your website conversions with real-time social proof notifications.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Social Proof Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Proof Widget - Conversion Optimization Platform',
    description: 'Boost your website conversions with real-time social proof notifications.',
    images: ['/og-image.jpg'],
    creator: '@socialproof',
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
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}