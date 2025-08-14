import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata = {
  title: {
    default: 'HashtagIQ - AI-Powered Social Media Hashtag Research',
    template: '%s | HashtagIQ',
  },
  description: 'Discover trending hashtags, analyze competition, and optimize your social media reach with AI-powered hashtag research tools.',
  keywords: [
    'hashtag research',
    'social media optimization',
    'Instagram hashtags',
    'Twitter hashtags',
    'TikTok hashtags',
    'hashtag analytics',
    'social media marketing',
    'content marketing',
    'influencer marketing',
    'hashtag generator',
  ],
  authors: [
    {
      name: 'HashtagIQ',
      url: 'https://hashtagiq.com',
    },
  ],
  creator: 'HashtagIQ',
  publisher: 'HashtagIQ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://hashtagiq.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HashtagIQ - AI-Powered Social Media Hashtag Research',
    description: 'Discover trending hashtags, analyze competition, and optimize your social media reach with AI-powered hashtag research tools.',
    url: 'https://hashtagiq.com',
    siteName: 'HashtagIQ',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HashtagIQ - AI-Powered Hashtag Research',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HashtagIQ - AI-Powered Social Media Hashtag Research',
    description: 'Discover trending hashtags, analyze competition, and optimize your social media reach with AI-powered hashtag research tools.',
    images: ['/twitter-image.jpg'],
    creator: '@hashtagiq',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}