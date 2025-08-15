import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'HeatmapTool - Website Analytics & User Behavior Insights',
    template: '%s | HeatmapTool'
  },
  description: 'Enterprise-grade website heatmap and user behavior analytics platform. Visualize clicks, scrolls, and user journeys with real-time insights and privacy-first design.',
  keywords: [
    'heatmap',
    'website analytics', 
    'user behavior',
    'click tracking',
    'scroll tracking',
    'conversion optimization',
    'UX analytics',
    'session replay',
    'A/B testing',
    'website optimization'
  ],
  authors: [{ name: 'HeatmapTool Team' }],
  creator: 'HeatmapTool',
  publisher: 'HeatmapTool',
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
    google: 'your-google-verification-code',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://heatmaptool.com',
    siteName: 'HeatmapTool',
    title: 'HeatmapTool - Website Analytics & User Behavior Insights',
    description: 'Enterprise-grade website heatmap and user behavior analytics platform with real-time insights.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HeatmapTool - Website Analytics Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeatmapTool - Website Analytics & User Behavior Insights',
    description: 'Enterprise-grade website heatmap and user behavior analytics platform with real-time insights.',
    images: ['/og-image.png'],
    creator: '@heatmaptool',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}