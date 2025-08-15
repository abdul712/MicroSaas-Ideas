import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blog Post Scheduler - Advanced Content Publishing Platform',
  description: 'Automate content publishing across multiple platforms with advanced scheduling, team collaboration, and analytics.',
  keywords: ['blog scheduler', 'content publishing', 'WordPress automation', 'Medium scheduler', 'content management'],
  authors: [{ name: 'Blog Post Scheduler Team' }],
  creator: 'Blog Post Scheduler',
  publisher: 'Blog Post Scheduler',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://blogpostscheduler.com',
    title: 'Blog Post Scheduler - Advanced Content Publishing Platform',
    description: 'Automate content publishing across multiple platforms with advanced scheduling, team collaboration, and analytics.',
    siteName: 'Blog Post Scheduler',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Post Scheduler - Advanced Content Publishing Platform',
    description: 'Automate content publishing across multiple platforms with advanced scheduling, team collaboration, and analytics.',
    creator: '@blogscheduler',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
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