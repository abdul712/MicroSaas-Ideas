import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'TimeTracker Pro - Smart Time Tracking & Automated Billing',
  description: 'Never lose another billable hour. Automatically track time across projects, generate accurate reports, and increase revenue by 20% with intelligent time capture.',
}

export default function HomePage() {
  return <LandingPage />
}