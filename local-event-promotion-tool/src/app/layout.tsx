import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EventPro - Local Event Promotion Platform',
  description: 'Promote your local events across all platforms in minutes. Create, manage, and market events with powerful automation tools.',
  keywords: [
    'event promotion',
    'local events',
    'social media marketing',
    'event management',
    'ticket sales',
    'community events',
    'business events',
    'marketing automation'
  ],
  authors: [{ name: 'EventPro Team' }],
  creator: 'EventPro',
  publisher: 'EventPro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://eventpro.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'EventPro - Local Event Promotion Platform',
    description: 'Promote your local events across all platforms in minutes',
    url: 'https://eventpro.com',
    siteName: 'EventPro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'EventPro - Local Event Promotion Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EventPro - Local Event Promotion Platform',
    description: 'Promote your local events across all platforms in minutes',
    images: ['/twitter-image.jpg'],
    creator: '@eventpro',
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
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EventPro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={cn(
        inter.className,
        'min-h-screen bg-background font-sans antialiased',
        'supports-[height:100dvh]:min-h-[100dvh]'
      )}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}