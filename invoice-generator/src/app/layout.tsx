import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Invoice Generator - Professional Invoicing Platform',
  description: 'Create professional invoices, track payments, and manage your business finances with our comprehensive invoicing platform.',
  keywords: 'invoice, billing, payments, accounting, business, freelance, small business',
  authors: [{ name: 'Invoice Generator Team' }],
  openGraph: {
    title: 'Invoice Generator - Professional Invoicing Platform',
    description: 'Create professional invoices, track payments, and manage your business finances.',
    type: 'website',
    url: 'https://invoice-generator.com',
    siteName: 'Invoice Generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invoice Generator - Professional Invoicing Platform',
    description: 'Create professional invoices, track payments, and manage your business finances.',
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
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}