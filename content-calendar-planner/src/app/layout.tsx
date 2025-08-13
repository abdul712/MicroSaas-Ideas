import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Content Calendar Planner - Social Media Scheduling Made Simple',
  description: 'Plan, create, and schedule your social media content across all platforms with our intuitive drag-and-drop calendar interface.',
  keywords: ['social media', 'content calendar', 'scheduling', 'marketing', 'content planning'],
  authors: [{ name: 'Content Calendar Planner Team' }],
  creator: 'Content Calendar Planner',
  publisher: 'Content Calendar Planner',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Content Calendar Planner - Social Media Scheduling Made Simple',
    description: 'Plan, create, and schedule your social media content across all platforms with our intuitive drag-and-drop calendar interface.',
    siteName: 'Content Calendar Planner',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Content Calendar Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Content Calendar Planner - Social Media Scheduling Made Simple',
    description: 'Plan, create, and schedule your social media content across all platforms with our intuitive drag-and-drop calendar interface.',
    images: ['/og-image.png'],
    creator: '@contentcalendar',
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