import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TimeTracker Pro - Smart Time Tracking & Billing',
  description: 'Comprehensive time tracking SaaS with automated billing, team collaboration, and productivity insights. Never lose another billable hour.',
  keywords: [
    'time tracking',
    'productivity',
    'billing',
    'invoicing',
    'team collaboration',
    'project management',
    'freelancer tools',
    'automatic tracking'
  ],
  authors: [{ name: 'TimeTracker Pro Team' }],
  creator: 'TimeTracker Pro',
  publisher: 'TimeTracker Pro',
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
    url: 'https://timetracker-pro.com',
    title: 'TimeTracker Pro - Smart Time Tracking & Billing',
    description: 'Comprehensive time tracking SaaS with automated billing, team collaboration, and productivity insights.',
    siteName: 'TimeTracker Pro',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TimeTracker Pro - Smart Time Tracking & Billing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TimeTracker Pro - Smart Time Tracking & Billing',
    description: 'Never lose another billable hour with intelligent time tracking and seamless billing.',
    images: ['/og-image.png'],
    creator: '@timetrackerpro',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TimeTracker Pro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}