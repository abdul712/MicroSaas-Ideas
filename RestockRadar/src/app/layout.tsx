import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RestockRadar - AI-Powered Inventory Management',
  description: 'Enterprise-grade inventory management platform with AI-powered demand forecasting, automated reordering, and real-time multi-channel synchronization.',
  keywords: [
    'inventory management',
    'demand forecasting',
    'automated reordering',
    'e-commerce',
    'AI',
    'machine learning',
    'supply chain',
    'warehouse management'
  ],
  authors: [{ name: 'RestockRadar Team' }],
  creator: 'RestockRadar',
  publisher: 'RestockRadar',
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
    url: 'https://restockradar.com',
    siteName: 'RestockRadar',
    title: 'RestockRadar - AI-Powered Inventory Management',
    description: 'Transform your inventory management with AI-powered demand forecasting and automated reordering.',
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
    description: 'Transform your inventory management with AI-powered demand forecasting and automated reordering.',
    images: ['/twitter-image.png'],
    creator: '@restockradar',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}