import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Recipe Cost Calculator - Professional Food Cost Management',
    template: '%s | Recipe Cost Calculator'
  },
  description: 'Calculate recipe costs, manage ingredients, and optimize menu pricing for restaurants, catering, and food businesses. Real-time cost tracking with supplier integrations.',
  keywords: [
    'recipe cost calculator',
    'food cost management',
    'restaurant costing',
    'menu pricing',
    'ingredient cost tracking',
    'kitchen management',
    'food service software'
  ],
  authors: [{ name: 'Recipe Cost Calculator Team' }],
  creator: 'Recipe Cost Calculator',
  publisher: 'Recipe Cost Calculator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'Recipe Cost Calculator',
    title: 'Recipe Cost Calculator - Professional Food Cost Management',
    description: 'Calculate recipe costs, manage ingredients, and optimize menu pricing for restaurants, catering, and food businesses.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Recipe Cost Calculator - Professional Food Cost Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recipe Cost Calculator - Professional Food Cost Management',
    description: 'Calculate recipe costs, manage ingredients, and optimize menu pricing for restaurants, catering, and food businesses.',
    images: ['/og-image.png'],
    creator: '@recipecostcalc',
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Recipe Cost Calculator" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}