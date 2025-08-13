import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Business Health Dashboard',
  description: 'Real-time business health monitoring and analytics platform',
  keywords: 'business health, dashboard, analytics, metrics, KPIs, real-time monitoring',
  authors: [{ name: 'Business Health Dashboard' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Business Health Dashboard',
    description: 'Real-time business health monitoring and analytics platform',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Health Dashboard',
    description: 'Real-time business health monitoring and analytics platform',
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
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}