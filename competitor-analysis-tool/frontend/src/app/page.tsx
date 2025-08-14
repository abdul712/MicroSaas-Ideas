import { Metadata } from 'next'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { CompetitorShowcase } from '@/components/landing/competitor-showcase'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CTASection } from '@/components/landing/cta-section'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Competitor Analysis Platform - AI-Powered Market Intelligence',
  description: 'Stay ahead with automated competitor monitoring, AI insights, and real-time market intelligence. Enterprise-grade competitive analysis for modern businesses.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CompetitorShowcase />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}