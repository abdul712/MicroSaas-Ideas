import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lead Magnet Creator - AI-Powered Lead Generation',
  description: 'Create stunning lead magnets and high-converting opt-in forms in minutes with our AI-powered platform. No design skills needed.',
  keywords: 'lead magnet, lead generation, email marketing, conversion optimization, AI content creation',
  authors: [{ name: 'Lead Magnet Creator Team' }],
  creator: 'Lead Magnet Creator',
  publisher: 'Lead Magnet Creator',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://leadmagnetcreator.com',
    siteName: 'Lead Magnet Creator',
    title: 'Lead Magnet Creator - AI-Powered Lead Generation',
    description: 'Create stunning lead magnets and high-converting opt-in forms in minutes with our AI-powered platform.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lead Magnet Creator - AI-Powered Lead Generation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@leadmagnetcreator',
    creator: '@leadmagnetcreator',
    title: 'Lead Magnet Creator - AI-Powered Lead Generation',
    description: 'Create stunning lead magnets and high-converting opt-in forms in minutes with our AI-powered platform.',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}