import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Customer Support System - Enterprise Ticket Management',
  description: 'AI-powered customer support ticket system with multi-channel support, real-time collaboration, and advanced analytics.',
  keywords: ['customer support', 'ticket system', 'helpdesk', 'AI automation', 'enterprise'],
  authors: [{ name: 'Customer Support System Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Customer Support System',
    description: 'Enterprise-grade customer support ticket management platform',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Support System',
    description: 'Enterprise-grade customer support ticket management platform',
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