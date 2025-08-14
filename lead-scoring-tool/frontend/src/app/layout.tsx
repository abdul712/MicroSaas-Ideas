import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lead Scoring Tool - AI-Powered Lead Qualification',
  description: 'Intelligent lead scoring and qualification platform using AI and machine learning to automatically score, prioritize, and route leads.',
  keywords: ['lead scoring', 'ai', 'machine learning', 'sales', 'marketing', 'saas'],
  authors: [{ name: 'Lead Scoring Team' }],
  creator: 'Lead Scoring Team',
  publisher: 'Lead Scoring Tool',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Lead Scoring Tool - AI-Powered Lead Qualification',
    description: 'Intelligent lead scoring and qualification platform using AI and machine learning.',
    siteName: 'Lead Scoring Tool',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lead Scoring Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lead Scoring Tool - AI-Powered Lead Qualification',
    description: 'Intelligent lead scoring and qualification platform using AI and machine learning.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#0ea5e9',
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
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}