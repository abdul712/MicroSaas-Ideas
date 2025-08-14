import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'

import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Social Caption Generator - AI-Powered Social Media Captions',
    template: '%s | Social Caption Generator'
  },
  description: 'Generate engaging, platform-optimized social media captions with AI. Support for Instagram, Facebook, Twitter, LinkedIn, and TikTok with brand voice customization.',
  keywords: [
    'social media captions',
    'AI caption generator',
    'Instagram captions',
    'Facebook posts',
    'Twitter content',
    'LinkedIn posts',
    'TikTok captions',
    'brand voice',
    'content marketing',
    'social media marketing'
  ],
  authors: [{ name: 'Abdul Rahim' }],
  creator: 'Abdul Rahim',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://social-caption-generator.vercel.app',
    title: 'Social Caption Generator - AI-Powered Social Media Captions',
    description: 'Generate engaging, platform-optimized social media captions with AI. Support for Instagram, Facebook, Twitter, LinkedIn, and TikTok with brand voice customization.',
    siteName: 'Social Caption Generator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Social Caption Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Caption Generator - AI-Powered Social Media Captions',
    description: 'Generate engaging, platform-optimized social media captions with AI.',
    images: ['/og-image.png'],
    creator: '@abdul712',
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
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'your-google-site-verification',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}