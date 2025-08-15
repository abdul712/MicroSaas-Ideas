import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Local Business Review Manager - Manage Your Online Reputation',
  description: 'Comprehensive review management platform for local businesses. Monitor, respond to, and improve your online reviews across Google, Facebook, Yelp, and more.',
  keywords: [
    'review management',
    'online reputation',
    'local business',
    'Google reviews',
    'Facebook reviews',
    'Yelp reviews',
    'customer feedback',
    'business reviews',
    'review monitoring',
    'review responses'
  ],
  authors: [{ name: 'Local Business Review Manager' }],
  creator: 'Local Business Review Manager',
  publisher: 'Local Business Review Manager',
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
    url: 'https://reviewmanager.local',
    siteName: 'Local Business Review Manager',
    title: 'Local Business Review Manager - Manage Your Online Reputation',
    description: 'Comprehensive review management platform for local businesses. Monitor, respond to, and improve your online reviews across multiple platforms.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Local Business Review Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Local Business Review Manager - Manage Your Online Reputation',
    description: 'Comprehensive review management platform for local businesses. Monitor, respond to, and improve your online reviews across multiple platforms.',
    images: ['/og-image.png'],
    creator: '@reviewmanager',
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
        color: '#2563eb',
      },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://reviewmanager.local',
  },
  category: 'business',
  classification: 'Business Software',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Review Manager',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#ffffff',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f23' },
  ],
  colorScheme: 'light dark',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for platform APIs */}
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://graph.facebook.com" />
        <link rel="dns-prefetch" href="https://api.yelp.com" />
        <link rel="dns-prefetch" href="https://api.tripadvisor.com" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Content Security Policy */}
        <meta 
          httpEquiv="Content-Security-Policy" 
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'none'; object-src 'none'; base-uri 'self';"
        />
        
        {/* Structured Data for Business Software */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Local Business Review Manager",
              "description": "Comprehensive review management platform for local businesses",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "provider": {
                "@type": "Organization",
                "name": "Local Business Review Manager"
              }
            })
          }}
        />
      </head>
      <body 
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
        suppressHydrationWarning
      >
        <Providers>
          <div id="root" className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
          </div>
          <div id="modal-root" />
          <div id="toast-root" />
        </Providers>
        
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Skip to main content
        </a>
        
        {/* NoScript fallback */}
        <noscript>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border rounded-lg p-6 max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-2">JavaScript Required</h2>
              <p className="text-muted-foreground">
                This application requires JavaScript to function properly. 
                Please enable JavaScript in your browser settings and reload the page.
              </p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  )
}