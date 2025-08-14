import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'RestockRadar - AI-Powered Inventory Management',
    template: '%s | RestockRadar',
  },
  description: 'Enterprise-grade inventory management platform with AI-powered demand forecasting, automated reordering, and real-time multi-channel synchronization.',
  keywords: [
    'inventory management',
    'demand forecasting',
    'AI',
    'machine learning',
    'SaaS',
    'e-commerce',
    'stock management',
    'supply chain',
    'automation',
    'analytics',
    'Shopify',
    'Amazon',
    'eBay',
    'WooCommerce',
    'BigCommerce',
  ],
  authors: [
    {
      name: 'RestockRadar Team',
      url: 'https://restockradar.com',
    },
  ],
  creator: 'RestockRadar',
  publisher: 'RestockRadar',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://restockradar.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'RestockRadar - AI-Powered Inventory Management',
    description: 'Enterprise-grade inventory management platform with AI-powered demand forecasting, automated reordering, and real-time multi-channel synchronization.',
    siteName: 'RestockRadar',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RestockRadar - AI-Powered Inventory Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RestockRadar - AI-Powered Inventory Management',
    description: 'Enterprise-grade inventory management platform with AI-powered demand forecasting, automated reordering, and real-time multi-channel synchronization.',
    images: ['/og-image.png'],
    creator: '@restockradar',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </Providers>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}