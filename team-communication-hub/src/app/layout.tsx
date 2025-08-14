import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Team Communication Hub - Enterprise Team Collaboration Platform',
  description: 'Real-time messaging, AI-powered communication, and enterprise-grade team collaboration. Built for modern teams.',
  keywords: ['team chat', 'messaging', 'collaboration', 'enterprise', 'real-time', 'AI assistant'],
  authors: [{ name: 'Team Communication Hub' }],
  openGraph: {
    title: 'Team Communication Hub',
    description: 'Enterprise-grade team collaboration platform with real-time messaging and AI assistance',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team Communication Hub',
    description: 'Enterprise-grade team collaboration platform',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
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
        </Providers>
      </body>
    </html>
  )
}