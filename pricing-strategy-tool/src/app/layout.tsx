import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pricing Strategy Tool - AI-Powered Price Optimization',
  description: 'Optimize your pricing strategy with AI-powered competitor analysis, market insights, and revenue impact predictions.',
  keywords: 'pricing strategy, competitor analysis, price optimization, AI pricing, revenue optimization',
  authors: [{ name: 'Pricing Strategy Tool' }],
  creator: 'Pricing Strategy Tool',
  publisher: 'Pricing Strategy Tool',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Pricing Strategy Tool - AI-Powered Price Optimization',
    description: 'Optimize your pricing strategy with AI-powered competitor analysis, market insights, and revenue impact predictions.',
    url: '/',
    siteName: 'Pricing Strategy Tool',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing Strategy Tool - AI-Powered Price Optimization',
    description: 'Optimize your pricing strategy with AI-powered competitor analysis, market insights, and revenue impact predictions.',
    creator: '@pricingstrategy',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}