import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Email Campaign Analytics | Advanced Email Marketing Insights',
  description: 'Comprehensive email marketing analytics platform with multi-provider integration, A/B testing, and AI-powered insights to optimize your campaigns.',
  keywords: 'email marketing, analytics, campaign performance, email optimization, marketing analytics',
  authors: [{ name: 'Email Campaign Analytics Team' }],
  openGraph: {
    title: 'Email Campaign Analytics',
    description: 'Advanced email marketing analytics platform',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Email Campaign Analytics',
    description: 'Advanced email marketing analytics platform',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
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
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}