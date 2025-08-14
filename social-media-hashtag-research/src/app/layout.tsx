import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'HashtagPro - AI-Powered Social Media Hashtag Research',
  description: 'Discover trending hashtags, analyze competitors, and optimize your social media reach with AI-powered hashtag research and analytics.',
  keywords: [
    'hashtag research',
    'social media analytics',
    'Instagram hashtags',
    'Twitter hashtags',
    'social media optimization',
    'hashtag generator',
    'trending hashtags',
    'competitor analysis'
  ],
  authors: [{ name: 'HashtagPro Team' }],
  creator: 'HashtagPro',
  publisher: 'HashtagPro',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL,
    title: 'HashtagPro - AI-Powered Social Media Hashtag Research',
    description: 'Discover trending hashtags, analyze competitors, and optimize your social media reach with AI-powered hashtag research and analytics.',
    siteName: 'HashtagPro',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HashtagPro - Social Media Hashtag Research Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HashtagPro - AI-Powered Social Media Hashtag Research',
    description: 'Discover trending hashtags, analyze competitors, and optimize your social media reach with AI-powered hashtag research and analytics.',
    images: ['/twitter-image.png'],
    creator: '@hashtagpro',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXTAUTH_URL,
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
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HashtagPro" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}