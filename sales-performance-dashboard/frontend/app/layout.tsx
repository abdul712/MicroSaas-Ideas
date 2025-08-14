import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Sales Performance Dashboard',
    default: 'Sales Performance Dashboard - AI-Powered Sales Analytics',
  },
  description: 'Enterprise-grade sales performance analytics and business intelligence platform with real-time insights, AI forecasting, and CRM integrations.',
  keywords: [
    'sales analytics',
    'business intelligence',
    'CRM integration',
    'sales forecasting',
    'real-time dashboard',
    'team performance',
    'revenue tracking',
    'AI insights',
  ],
  authors: [{ name: 'Sales Dashboard Team' }],
  creator: 'Sales Dashboard',
  publisher: 'Sales Dashboard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Sales Performance Dashboard - AI-Powered Sales Analytics',
    description: 'Transform your sales data into actionable insights with our enterprise-grade analytics platform.',
    siteName: 'Sales Performance Dashboard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sales Performance Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sales Performance Dashboard - AI-Powered Sales Analytics',
    description: 'Transform your sales data into actionable insights with our enterprise-grade analytics platform.',
    images: ['/og-image.png'],
    creator: '@salesdashboard',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
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
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sales Dashboard',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Sales Dashboard',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="//api.salesdashboard.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Content Security Policy */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: ws:; frame-ancestors 'none';"
        />
        
        {/* Resource hints */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Analytics and monitoring */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
            
            {/* Sentry for error monitoring */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  import("@sentry/browser").then(Sentry => {
                    Sentry.init({
                      dsn: "${process.env.NEXT_PUBLIC_SENTRY_DSN}",
                      environment: "${process.env.NODE_ENV}",
                      tracesSampleRate: 0.1,
                    });
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-100 btn-primary"
          >
            Skip to main content
          </a>
          
          {/* Main application */}
          <div id="main-content" role="main">
            {children}
          </div>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 25px 0 rgba(0, 0, 0, 0.12)',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
              loading: {
                style: {
                  background: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                },
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          
          {/* Service worker registration */}
          {process.env.NODE_ENV === 'production' && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js')
                        .then(function(registration) {
                          console.log('SW registered: ', registration);
                        })
                        .catch(function(registrationError) {
                          console.log('SW registration failed: ', registrationError);
                        });
                    });
                  }
                `,
              }}
            />
          )}
          
          {/* Development tools */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 z-100">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                Dev Mode
              </div>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}