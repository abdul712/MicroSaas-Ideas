import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Follow-up Email Automator",
  description: "AI-powered email automation platform for increasing conversions and customer engagement",
  keywords: ["email automation", "follow-up emails", "AI email", "email marketing", "customer engagement"],
  authors: [{ name: "Follow-up Email Automator Team" }],
  openGraph: {
    title: "Follow-up Email Automator",
    description: "AI-powered email automation platform for increasing conversions and customer engagement",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Follow-up Email Automator",
    description: "AI-powered email automation platform for increasing conversions and customer engagement",
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
        </Providers>
      </body>
    </html>
  );
}