import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QR Menu Generator - Digital Menus for Restaurants',
  description: 'Create beautiful QR code menus for your restaurant. Update instantly, track analytics, and provide contactless dining experiences.',
  keywords: 'QR menu, digital menu, restaurant menu, contactless dining, QR code generator',
  authors: [{ name: 'QR Menu Generator' }],
  creator: 'QR Menu Generator',
  publisher: 'QR Menu Generator',
  metadataBase: new URL('https://qrmenu.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://qrmenu.app',
    title: 'QR Menu Generator - Digital Menus for Restaurants',
    description: 'Create beautiful QR code menus for your restaurant. Update instantly, track analytics, and provide contactless dining experiences.',
    siteName: 'QR Menu Generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Menu Generator - Digital Menus for Restaurants',
    description: 'Create beautiful QR code menus for your restaurant. Update instantly, track analytics, and provide contactless dining experiences.',
    creator: '@qrmenuapp',
  },
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
  verification: {
    google: 'google-site-verification-code',
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