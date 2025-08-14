import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Customer Loyalty Program - Rewards & Retention Platform',
  description: 'Build customer loyalty without breaking the bank. Create a digital rewards program that keeps customers coming back.',
  keywords: ['loyalty program', 'customer retention', 'rewards', 'small business', 'customer engagement'],
  authors: [{ name: 'Loyalty Platform Team' }],
  openGraph: {
    title: 'Customer Loyalty Program Platform',
    description: 'Digital rewards program that grows your business',
    type: 'website',
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
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}