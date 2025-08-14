import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Content Idea Generator - AI-Powered Content Creation Platform',
  description: 'Generate engaging content ideas using AI, trend analysis, and competitor research. Never run out of content ideas again.',
  keywords: [
    'content ideas',
    'content generation',
    'AI content',
    'blog ideas',
    'content marketing',
    'SEO content',
    'trend analysis',
    'content strategy',
  ],
  authors: [{ name: 'Content Idea Generator Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Content Idea Generator - AI-Powered Content Creation Platform',
    description: 'Generate engaging content ideas using AI, trend analysis, and competitor research.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Content Idea Generator - AI-Powered Content Creation Platform',
    description: 'Generate engaging content ideas using AI, trend analysis, and competitor research.',
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