import { Inter } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BundleGenius - AI-Powered E-commerce Product Bundling",
  description: "Optimize your e-commerce revenue with intelligent product bundling powered by advanced machine learning algorithms.",
  keywords: ["e-commerce", "product bundling", "AI", "machine learning", "revenue optimization", "Shopify", "WooCommerce"],
  authors: [{ name: "BundleGenius Team" }],
  creator: "BundleGenius",
  publisher: "BundleGenius",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    title: "BundleGenius - AI-Powered E-commerce Product Bundling",
    description: "Optimize your e-commerce revenue with intelligent product bundling powered by advanced machine learning algorithms.",
    url: "/",
    siteName: "BundleGenius",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BundleGenius - AI-Powered Product Bundling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BundleGenius - AI-Powered E-commerce Product Bundling",
    description: "Optimize your e-commerce revenue with intelligent product bundling powered by advanced machine learning algorithms.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#e11d48" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}