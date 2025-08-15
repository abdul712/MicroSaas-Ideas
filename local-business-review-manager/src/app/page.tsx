import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'Local Business Review Manager - Transform Your Online Reputation',
  description: 'Monitor, manage, and improve your business reviews across Google, Facebook, Yelp, and TripAdvisor. AI-powered responses, real-time alerts, and comprehensive analytics.',
}

export default function HomePage() {
  return (
    <main id="main-content" className="flex-1">
      <LandingPage />
    </main>
  )
}