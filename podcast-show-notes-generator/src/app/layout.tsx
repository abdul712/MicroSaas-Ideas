import { Inter } from 'next/font/google'
import { NextAuthProvider } from '@/components/providers'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PodcastNotes AI - Generate Show Notes with AI',
  description: 'Transform your podcast audio into comprehensive, SEO-optimized show notes in minutes with AI-powered transcription and content generation.',
  keywords: 'podcast, show notes, transcription, AI, content generation, SEO',
  authors: [{ name: 'PodcastNotes AI Team' }],
  openGraph: {
    title: 'PodcastNotes AI - Generate Show Notes with AI',
    description: 'Transform your podcast audio into comprehensive, SEO-optimized show notes in minutes.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PodcastNotes AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PodcastNotes AI - Generate Show Notes with AI',
    description: 'Transform your podcast audio into comprehensive, SEO-optimized show notes in minutes.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              {children}
            </div>
            <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}