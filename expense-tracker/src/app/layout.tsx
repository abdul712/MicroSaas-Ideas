import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Expense Tracker - Complete Financial Management',
  description: 'Comprehensive expense tracking and financial management platform for small businesses and individuals',
  keywords: ['expense tracking', 'financial management', 'receipt scanning', 'budget management', 'tax preparation'],
  authors: [{ name: 'Expense Tracker Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Expense Tracker - Complete Financial Management',
    description: 'Track expenses, scan receipts, manage budgets, and prepare for taxes with our comprehensive platform',
    type: 'website',
    siteName: 'Expense Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Tracker - Complete Financial Management',
    description: 'Track expenses, scan receipts, manage budgets, and prepare for taxes',
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}