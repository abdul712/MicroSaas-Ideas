import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CaptionGenius - AI-Powered Social Media Caption Generator',
  description: 'Generate engaging, platform-optimized social media captions with AI. Support for Instagram, Facebook, Twitter, LinkedIn, TikTok and more.',
  keywords: 'social media, captions, AI, content creation, Instagram, Facebook, Twitter, LinkedIn, TikTok',
  authors: [{ name: 'CaptionGenius Team' }],
  creator: 'CaptionGenius',
  publisher: 'CaptionGenius',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'CaptionGenius - AI-Powered Social Media Caption Generator',
    description: 'Generate engaging, platform-optimized social media captions with AI',
    url: '/',
    siteName: 'CaptionGenius',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CaptionGenius - AI-Powered Social Media Caption Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaptionGenius - AI-Powered Social Media Caption Generator',
    description: 'Generate engaging, platform-optimized social media captions with AI',
    images: ['/og-image.png'],
    creator: '@captiongenius',
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
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}