import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/providers/providers'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lead Magnet Creator - AI-Powered Lead Generation Platform',
  description: 'Create stunning lead magnets and high-converting opt-in forms in minutes with our AI-powered platform. No design skills needed.',
  keywords: ['lead magnet', 'lead generation', 'opt-in forms', 'content creation', 'AI'],
  authors: [{ name: 'Lead Magnet Creator Team' }],
  openGraph: {
    title: 'Lead Magnet Creator - AI-Powered Lead Generation Platform',
    description: 'Create stunning lead magnets and high-converting opt-in forms in minutes with our AI-powered platform.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lead Magnet Creator - AI-Powered Lead Generation Platform',
    description: 'Create stunning lead magnets and high-converting opt-in forms in minutes with our AI-powered platform.',
  },
  robots: {
    index: true,
    follow: true,
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
        <Analytics />
      </body>
    </html>
  )
}