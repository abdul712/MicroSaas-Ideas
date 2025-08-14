import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lead Magnet Creator - AI-Powered Lead Generation Platform',
  description: 'Create high-converting lead magnets with AI assistance. Design, optimize, and distribute lead magnets that drive business growth.',
  keywords: [
    'lead magnet',
    'lead generation',
    'AI content creation',
    'conversion optimization',
    'marketing automation',
    'email marketing',
    'lead capture'
  ],
  authors: [{ name: 'Lead Magnet Creator Team' }],
  creator: 'Lead Magnet Creator',
  publisher: 'Lead Magnet Creator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://leadmagnetcreator.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lead Magnet Creator - AI-Powered Lead Generation Platform',
    description: 'Create high-converting lead magnets with AI assistance. Design, optimize, and distribute lead magnets that drive business growth.',
    url: 'https://leadmagnetcreator.com',
    siteName: 'Lead Magnet Creator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lead Magnet Creator Platform'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lead Magnet Creator - AI-Powered Lead Generation',
    description: 'Create high-converting lead magnets with AI assistance',
    images: ['/twitter-image.png'],
    creator: '@leadmagnetcreator',
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
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#3b82f6',
      },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#3b82f6',
    'theme-color': '#ffffff',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}