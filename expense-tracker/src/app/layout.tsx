import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExpenseTracker Pro - AI-Powered Expense Management',
  description: 'Enterprise-grade expense tracking with OCR receipt scanning, AI categorization, and real-time insights for businesses and professionals.',
  keywords: 'expense tracker, receipt management, OCR, financial management, business expenses, tax deductions',
  authors: [{ name: 'ExpenseTracker Pro Team' }],
  creator: 'ExpenseTracker Pro',
  publisher: 'ExpenseTracker Pro',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0070f3',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://expensetracker.pro',
    title: 'ExpenseTracker Pro - AI-Powered Expense Management',
    description: 'Enterprise-grade expense tracking with OCR receipt scanning, AI categorization, and real-time insights.',
    siteName: 'ExpenseTracker Pro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExpenseTracker Pro - AI-Powered Expense Management',
    description: 'Enterprise-grade expense tracking with OCR receipt scanning, AI categorization, and real-time insights.',
    creator: '@expensetrackerpro',
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
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}