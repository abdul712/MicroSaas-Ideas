import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Customer Journey Mapper - Visualize & Optimize Customer Experience',
  description: 'Map, analyze, and optimize every step of your customer journey with AI-powered insights and real-time analytics.',
  keywords: 'customer journey mapping, user experience analytics, conversion optimization, customer analytics',
  authors: [{ name: 'Journey Mapper Team' }],
  openGraph: {
    title: 'Customer Journey Mapper - Visualize & Optimize Customer Experience',
    description: 'Map, analyze, and optimize every step of your customer journey with AI-powered insights and real-time analytics.',
    type: 'website',
    siteName: 'Customer Journey Mapper',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Journey Mapper - Visualize & Optimize Customer Experience',
    description: 'Map, analyze, and optimize every step of your customer journey with AI-powered insights and real-time analytics.',
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
        </Providers>
      </body>
    </html>
  )
}