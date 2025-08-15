import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digital Business Card - Professional Networking Made Simple',
  description: 'Create, share, and track your digital business cards with QR codes, analytics, and team management.',
  keywords: 'digital business card, QR code, networking, professional, contact sharing',
  authors: [{ name: 'Digital Business Card Team' }],
  creator: 'Digital Business Card',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://digitalbusinesscard.com',
    title: 'Digital Business Card - Professional Networking Made Simple',
    description: 'Create, share, and track your digital business cards with QR codes, analytics, and team management.',
    siteName: 'Digital Business Card',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Business Card - Professional Networking Made Simple',
    description: 'Create, share, and track your digital business cards with QR codes, analytics, and team management.',
  },
  robots: {
    index: true,
    follow: true,
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
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}