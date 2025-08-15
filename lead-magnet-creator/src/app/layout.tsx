import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lead Magnet Creator - Create High-Converting Lead Magnets in Minutes',
  description: 'Create stunning lead magnets and high-converting opt-in forms without design skills. Professional templates, drag-and-drop editor, and instant publishing.',
  keywords: 'lead magnet, opt-in forms, email marketing, lead generation, PDF creator, landing pages',
  authors: [{ name: 'Lead Magnet Creator' }],
  openGraph: {
    title: 'Lead Magnet Creator - Create High-Converting Lead Magnets',
    description: 'Create stunning lead magnets and high-converting opt-in forms without design skills.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lead Magnet Creator',
    description: 'Create stunning lead magnets and high-converting opt-in forms without design skills.',
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