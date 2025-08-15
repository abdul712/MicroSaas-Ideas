import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'Sales Performance Dashboard - Transform Your Sales Data Into Growth',
  description: 'Enterprise-grade sales analytics platform with real-time insights, AI-powered forecasting, and seamless CRM integrations. Increase revenue by 25% with data-driven sales intelligence.',
  openGraph: {
    title: 'Sales Performance Dashboard - Transform Your Sales Data Into Growth',
    description: 'Enterprise-grade sales analytics platform with real-time insights, AI-powered forecasting, and seamless CRM integrations.',
  },
}

export default function HomePage() {
  return <LandingPage />
}