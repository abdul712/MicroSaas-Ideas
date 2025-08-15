import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'Competitor Analysis Platform - Enterprise Market Intelligence',
  description: 'Automatically monitor competitors, analyze market trends, and get actionable insights for strategic decision-making. Enterprise-grade competitive intelligence platform.',
  openGraph: {
    title: 'Competitor Analysis Platform - Enterprise Market Intelligence',
    description: 'Automatically monitor competitors, analyze market trends, and get actionable insights for strategic decision-making.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Competitor Analysis Platform - Enterprise Market Intelligence',
    description: 'Automatically monitor competitors, analyze market trends, and get actionable insights for strategic decision-making.',
  },
}

export default function HomePage() {
  return <LandingPage />
}