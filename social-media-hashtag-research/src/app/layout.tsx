import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HashtagPro - Social Media Hashtag Research & Analytics',
  description: 'Discover trending hashtags, analyze competition, and boost your social media reach with AI-powered hashtag research tools.',
  keywords: 'hashtag research, social media marketing, Instagram hashtags, Twitter hashtags, TikTok hashtags, hashtag analytics',
  authors: [{ name: 'HashtagPro Team' }],
  creator: 'HashtagPro',
  metadataBase: new URL('https://hashtagpro.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hashtagpro.ai',
    title: 'HashtagPro - AI-Powered Hashtag Research',
    description: 'Boost your social media reach with data-driven hashtag recommendations and real-time analytics.',
    siteName: 'HashtagPro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HashtagPro - Social Media Hashtag Research',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HashtagPro - AI-Powered Hashtag Research',
    description: 'Discover trending hashtags and analyze competition with our AI-powered research tools.',
    images: ['/twitter-image.jpg'],
    creator: '@hashtagpro',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
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
  )
}