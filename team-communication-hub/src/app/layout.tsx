import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Team Communication Hub - Enterprise Team Collaboration',
  description: 'Centralized team communication and collaboration platform with AI assistance, real-time messaging, and enterprise security.',
  keywords: 'team communication, collaboration, messaging, enterprise, real-time chat',
  authors: [{ name: 'Team Communication Hub' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  openGraph: {
    title: 'Team Communication Hub',
    description: 'Enterprise team collaboration platform with AI assistance',
    type: 'website',
    url: 'https://teamhub.example.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team Communication Hub',
    description: 'Enterprise team collaboration platform with AI assistance',
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
        <div id="root">{children}</div>
        <div id="modal-root" />
        <div id="tooltip-root" />
      </body>
    </html>
  )
}