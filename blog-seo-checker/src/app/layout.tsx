import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Blog SEO Checker - Comprehensive SEO Analysis & Optimization Platform',
  description: 'Professional SEO analysis and optimization platform for blogs and content websites. Get real-time SEO audits, keyword optimization, content scoring, and automated improvements.',
  keywords: [
    'SEO analysis',
    'blog optimization',
    'keyword research',
    'content analysis',
    'technical SEO',
    'SEO audit',
    'search engine optimization',
    'blog tools',
    'SEO platform',
    'content optimization'
  ],
  authors: [{ name: 'Blog SEO Checker' }],
  creator: 'Blog SEO Checker',
  publisher: 'Blog SEO Checker',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://blog-seo-checker.com',
    title: 'Blog SEO Checker - Comprehensive SEO Analysis Platform',
    description: 'Professional SEO analysis and optimization platform for blogs and content websites.',
    siteName: 'Blog SEO Checker',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog SEO Checker Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog SEO Checker - SEO Analysis Platform',
    description: 'Professional SEO analysis and optimization for blogs and content websites.',
    images: ['/og-image.jpg'],
    creator: '@blogseo checker',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}