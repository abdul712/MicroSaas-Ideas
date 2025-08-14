import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Team Communication Hub",
  description: "Enterprise-grade team communication and collaboration platform",
  keywords: ["team communication", "chat", "collaboration", "messaging", "workspace"],
  authors: [{ name: "Team Communication Hub" }],
  creator: "Team Communication Hub",
  publisher: "Team Communication Hub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "./",
    siteName: "Team Communication Hub",
    title: "Team Communication Hub - Enterprise Team Communication",
    description: "Streamline your team communication with our enterprise-grade messaging platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Team Communication Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Team Communication Hub",
    description: "Enterprise-grade team communication platform",
    images: ["/og-image.png"],
    creator: "@teamcommhub",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}