import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Conversion Rate Optimizer - AI-Powered CRO Platform',
  description: 'Maximize your website conversions with AI-powered optimization, advanced A/B testing, and real-time analytics. Enterprise-grade conversion rate optimization made simple.',
  keywords: 'conversion rate optimization, A/B testing, website optimization, CRO, analytics, AI optimization',
  authors: [{ name: 'CRO Platform Team' }],
  openGraph: {
    title: 'Conversion Rate Optimizer - AI-Powered CRO Platform',
    description: 'Maximize your website conversions with AI-powered optimization, advanced A/B testing, and real-time analytics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conversion Rate Optimizer - AI-Powered CRO Platform',
    description: 'Maximize your website conversions with AI-powered optimization, advanced A/B testing, and real-time analytics.',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
        <div id="modal-root" />
        <div id="tooltip-root" />
      </body>
    </html>
  )
}