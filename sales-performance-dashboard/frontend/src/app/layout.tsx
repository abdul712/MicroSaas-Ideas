import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Sales Performance Dashboard - AI-Powered Analytics',
  description: 'Enterprise-grade sales performance analytics with real-time insights, AI forecasting, and multi-source integrations. Transform your sales data into actionable business intelligence.',
  keywords: [
    'sales analytics',
    'performance dashboard',
    'business intelligence',
    'real-time metrics',
    'AI forecasting',
    'CRM integration',
    'sales KPIs',
    'revenue analytics'
  ],
  authors: [{ name: 'Sales Performance Dashboard Team' }],
  creator: 'Sales Performance Dashboard',
  publisher: 'Sales Performance Dashboard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Sales Performance Dashboard - AI-Powered Analytics',
    description: 'Enterprise-grade sales performance analytics with real-time insights and AI forecasting',
    siteName: 'Sales Performance Dashboard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sales Performance Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sales Performance Dashboard - AI-Powered Analytics',
    description: 'Enterprise-grade sales performance analytics with real-time insights and AI forecasting',
    images: ['/og-image.png'],
    creator: '@salesperfdash',
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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="relative min-h-screen bg-background font-sans antialiased">
            <div className="relative flex min-h-screen flex-col">
              {children}
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}