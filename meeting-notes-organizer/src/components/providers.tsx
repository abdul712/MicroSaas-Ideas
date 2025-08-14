'use client'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/toaster'
import { MeetingProvider } from './meeting-provider'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <MeetingProvider>
          {children}
          <Toaster />
        </MeetingProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}