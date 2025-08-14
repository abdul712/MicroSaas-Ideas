import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Website Heatmap Tool - Enterprise Analytics Platform',
  description: 'Privacy-first website heatmap and user behavior analytics platform for enterprise use',
  keywords: [
    'heatmap',
    'analytics',
    'user behavior',
    'conversion optimization',
    'website analytics',
    'session replay',
    'privacy compliant',
    'GDPR',
    'enterprise'
  ],
  authors: [{ name: 'Website Heatmap Tool Team' }],
  creator: 'Website Heatmap Tool',
  publisher: 'Website Heatmap Tool',
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
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Website Heatmap Tool',
    title: 'Website Heatmap Tool - Enterprise Analytics Platform',
    description: 'Privacy-first website heatmap and user behavior analytics platform for enterprise use',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Website Heatmap Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Website Heatmap Tool - Enterprise Analytics Platform',
    description: 'Privacy-first website heatmap and user behavior analytics platform for enterprise use',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}