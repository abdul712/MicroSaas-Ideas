import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import './globals.css';

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Heatmap Analytics - Website User Behavior Analytics',
    template: '%s | Heatmap Analytics',
  },
  description: 'Enterprise-grade website heatmap and user behavior analytics platform. Visualize user interactions, optimize conversions, and improve UX with real-time insights.',
  keywords: [
    'heatmap',
    'analytics',
    'user behavior',
    'conversion optimization',
    'website analytics',
    'UX analysis',
    'session replay',
    'A/B testing',
    'click tracking',
    'user experience',
  ],
  authors: [
    {
      name: 'Heatmap Analytics Team',
      url: 'https://heatmapanalytics.com',
    },
  ],
  creator: 'Heatmap Analytics',
  publisher: 'Heatmap Analytics',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://heatmapanalytics.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Heatmap Analytics - Website User Behavior Analytics',
    description: 'Enterprise-grade website heatmap and user behavior analytics platform. Visualize user interactions, optimize conversions, and improve UX with real-time insights.',
    siteName: 'Heatmap Analytics',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Heatmap Analytics Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heatmap Analytics - Website User Behavior Analytics',
    description: 'Enterprise-grade website heatmap and user behavior analytics platform.',
    images: ['/twitter-image.png'],
    creator: '@heatmapanalytics',
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
    other: {
      'msvalidate.01': 'your-bing-verification-code',
    },
  },
  category: 'technology',
  classification: 'Business',
  other: {
    'application-name': 'Heatmap Analytics',
    'apple-mobile-web-app-title': 'Heatmap Analytics',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
    'theme-color': '#0ea5e9',
    'color-scheme': 'dark light',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang=\"en\" suppressHydrationWarning>
      <head>
        {/* Preload critical fonts */}
        <link
          rel=\"preload\"
          href=\"/fonts/inter-var.woff2\"
          as=\"font\"
          type=\"font/woff2\"
          crossOrigin=\"anonymous\"
        />
        
        {/* Critical CSS inline for performance */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for above-the-fold content */
            html { line-height: 1.15; -webkit-text-size-adjust: 100%; }
            body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
            .loading-screen { 
              position: fixed; 
              inset: 0; 
              background: hsl(var(--background)); 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              z-index: 9999; 
            }
            .loading-spinner { 
              width: 32px; 
              height: 32px; 
              border: 2px solid hsl(var(--muted)); 
              border-top: 2px solid hsl(var(--primary)); 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
            }
            @keyframes spin { 
              0% { transform: rotate(0deg); } 
              100% { transform: rotate(360deg); } 
            }
          `,
        }} />

        {/* Favicon and app icons */}
        <link rel=\"icon\" href=\"/favicon.ico\" />
        <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"/favicon-32x32.png\" />
        <link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"/favicon-16x16.png\" />
        <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon.png\" />
        <link rel=\"manifest\" href=\"/site.webmanifest\" />
        <meta name=\"msapplication-TileColor\" content=\"#0ea5e9\" />
        <meta name=\"theme-color\" content=\"#0ea5e9\" />

        {/* Performance and SEO optimizations */}
        <link rel=\"dns-prefetch\" href=\"//fonts.googleapis.com\" />
        <link rel=\"dns-prefetch\" href=\"//api.heatmapanalytics.com\" />
        <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossOrigin=\"anonymous\" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          jetbrainsMono.variable
        )}
        suppressHydrationWarning
      >
        {/* Loading screen shown while app initializes */}
        <div id=\"loading-screen\" className=\"loading-screen\">
          <div className=\"loading-spinner\"></div>
        </div>

        <Providers>
          <div className=\"relative flex min-h-screen flex-col\">
            <div className=\"flex-1\">{children}</div>
          </div>
        </Providers>

        {/* Remove loading screen after app loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeLoadingScreen() {
                  const loadingScreen = document.getElementById('loading-screen');
                  if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                      loadingScreen.remove();
                    }, 300);
                  }
                }
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeLoadingScreen);
                } else {
                  removeLoadingScreen();
                }
              })();
            `,
          }}
        />

        {/* Analytics and tracking scripts (load after main content) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
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
              </>
            )}

            {/* Hotjar tracking */}
            {process.env.NEXT_PUBLIC_HOTJAR_ID && (
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (function(h,o,t,j,a,r){
                        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                        h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                        a=o.getElementsByTagName('head')[0];
                        r=o.createElement('script');r.async=1;
                        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                        a.appendChild(r);
                    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                  `,
                }}
              />
            )}

            {/* Custom heatmap tracking for self-analysis */}
            <script
              async
              src={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/heatmap-sdk.js`}
              data-site-id={process.env.NEXT_PUBLIC_SITE_ID}
            />
          </>
        )}
      </body>
    </html>
  );
}