import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Business Health Dashboard',
  description: 'Monitor your business vital signs at a glance. Get health scores, early warning alerts, and actionable recommendations.',
  keywords: 'business dashboard, business analytics, health score, business metrics, KPI dashboard',
  authors: [{ name: 'Business Health Dashboard' }],
  openGraph: {
    title: 'Business Health Dashboard',
    description: 'Your business vital signs at a glance',
    url: 'https://businesshealth.app',
    siteName: 'Business Health Dashboard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Health Dashboard',
    description: 'Your business vital signs at a glance',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
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
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </UserProvider>
      </body>
    </html>
  )
}