import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Customer Segmentation Tool - AI-Powered Marketing Analytics',
  description: 'Advanced customer segmentation and targeting platform with ML-powered algorithms, real-time analytics, and multi-platform integrations.',
  keywords: [
    'customer segmentation',
    'marketing analytics',
    'machine learning',
    'customer analytics',
    'marketing automation',
    'RFM analysis',
    'behavioral clustering',
    'predictive analytics'
  ],
  authors: [{ name: 'Customer Segmentation Tool' }],
  creator: 'Customer Segmentation Tool',
  publisher: 'Customer Segmentation Tool',
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
    url: 'https://customer-segmentation-tool.com',
    siteName: 'Customer Segmentation Tool',
    title: 'Customer Segmentation Tool - AI-Powered Marketing Analytics',
    description: 'Advanced customer segmentation and targeting platform with ML-powered algorithms, real-time analytics, and multi-platform integrations.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Customer Segmentation Tool Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Segmentation Tool - AI-Powered Marketing Analytics',
    description: 'Advanced customer segmentation and targeting platform with ML-powered algorithms, real-time analytics, and multi-platform integrations.',
    images: ['/og-image.jpg'],
    creator: '@customer_segments',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}