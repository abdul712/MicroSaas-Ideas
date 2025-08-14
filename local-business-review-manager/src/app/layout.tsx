import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReviewMaster - Local Business Review Manager',
  description: 'Enterprise-grade review management platform for local businesses. Monitor, manage, and respond to reviews across Google, Yelp, Facebook, and more.',
  keywords: [
    'review management',
    'local business',
    'online reputation',
    'Google My Business',
    'Yelp reviews',
    'Facebook reviews',
    'review monitoring',
    'AI responses',
    'sentiment analysis',
    'local SEO'
  ],
  authors: [{ name: 'ReviewMaster Team' }],
  creator: 'ReviewMaster',
  publisher: 'ReviewMaster',
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
    url: process.env.NEXTAUTH_URL || 'https://localhost:3000',
    title: 'ReviewMaster - Local Business Review Manager',
    description: 'Enterprise-grade review management platform for local businesses. Monitor, manage, and respond to reviews across all major platforms.',
    siteName: 'ReviewMaster',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ReviewMaster - Local Business Review Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewMaster - Local Business Review Manager',
    description: 'Enterprise-grade review management platform for local businesses.',
    images: ['/og-image.png'],
    creator: '@reviewmaster',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://localhost:3000'),
  alternates: {
    canonical: '/',
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
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}