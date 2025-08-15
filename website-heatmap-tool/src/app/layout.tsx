import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HeatMap Analytics - Website User Behavior Tracking',
  description: 'Advanced heatmap and user behavior analytics platform for websites. Track clicks, scrolling, and user interactions with privacy-first analytics.',
  keywords: 'heatmap, analytics, user behavior, website tracking, click tracking, scroll tracking',
  authors: [{ name: 'HeatMap Analytics' }],
  robots: 'index, follow',
  openGraph: {
    title: 'HeatMap Analytics - Website User Behavior Tracking',
    description: 'Advanced heatmap and user behavior analytics platform for websites.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeatMap Analytics - Website User Behavior Tracking',
    description: 'Advanced heatmap and user behavior analytics platform for websites.',
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