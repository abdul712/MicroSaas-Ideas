import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Appointment Booking Widget - Grow Your Business with Seamless Scheduling',
  description: 'Embeddable appointment booking widget with calendar integrations, automated reminders, and payment processing for service-based businesses.',
  keywords: ['appointment booking', 'scheduling software', 'booking widget', 'calendar integration', 'business automation'],
  authors: [{ name: 'Appointment Booking Widget Team' }],
  creator: 'Appointment Booking Widget',
  publisher: 'Appointment Booking Widget',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://appointmentbookingwidget.com',
    title: 'Appointment Booking Widget - Professional Scheduling Made Simple',
    description: 'Transform your business with our embeddable booking widget. Calendar sync, automated notifications, and payment processing.',
    siteName: 'Appointment Booking Widget',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Appointment Booking Widget - Professional Scheduling Made Simple',
    description: 'Transform your business with our embeddable booking widget. Calendar sync, automated notifications, and payment processing.',
    creator: '@appointmentwidget',
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
    google: 'google-site-verification-token',
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
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}