import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RestockRadar - AI-Powered Inventory Management',
  description: 'Enterprise inventory management with AI-powered demand forecasting, automated reordering, and real-time multi-channel synchronization.',
  keywords: ['inventory management', 'demand forecasting', 'automated reordering', 'e-commerce', 'AI', 'machine learning'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}