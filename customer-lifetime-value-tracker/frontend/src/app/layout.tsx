import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CLV Tracker - Customer Lifetime Value Analytics',
  description: 'Track and analyze customer lifetime value with predictive analytics and real-time insights.',
  keywords: ['CLV', 'Customer Lifetime Value', 'Analytics', 'SaaS', 'E-commerce'],
  authors: [{ name: 'CLV Tracker Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'CLV Tracker - Customer Lifetime Value Analytics',
    description: 'Track and analyze customer lifetime value with predictive analytics and real-time insights.',
    type: 'website',
    url: 'https://clvtracker.com',
    siteName: 'CLV Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLV Tracker - Customer Lifetime Value Analytics',
    description: 'Track and analyze customer lifetime value with predictive analytics and real-time insights.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}