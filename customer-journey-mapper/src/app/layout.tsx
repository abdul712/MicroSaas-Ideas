import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Customer Journey Mapper - User Experience Analytics Platform',
  description: 'Build comprehensive customer journey maps that visualize user interactions across all touchpoints, identify pain points, analyze conversion paths, and optimize the entire customer experience.',
  keywords: [
    'customer journey mapping',
    'user experience analytics',
    'conversion optimization',
    'touchpoint analysis',
    'customer analytics',
    'journey visualization'
  ],
  authors: [{ name: 'Customer Journey Mapper Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://customerjourneymapper.com',
    title: 'Customer Journey Mapper - User Experience Analytics Platform',
    description: 'Build comprehensive customer journey maps that visualize user interactions across all touchpoints, identify pain points, analyze conversion paths, and optimize the entire customer experience.',
    siteName: 'Customer Journey Mapper',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Journey Mapper - User Experience Analytics Platform',
    description: 'Build comprehensive customer journey maps that visualize user interactions across all touchpoints, identify pain points, analyze conversion paths, and optimize the entire customer experience.',
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}