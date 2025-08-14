import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meeting Notes Organizer - AI-Powered Meeting Management',
  description: 'Intelligent meeting notes and management platform that automatically transcribes meetings, organizes notes, extracts action items, and tracks decisions.',
  keywords: ['meeting notes', 'AI transcription', 'meeting management', 'collaboration', 'productivity'],
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