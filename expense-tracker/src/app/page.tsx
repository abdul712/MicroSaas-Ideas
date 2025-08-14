import { Suspense } from 'react';
import { Metadata } from 'next';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';
import { Navigation } from '@/components/landing/navigation';

export const metadata: Metadata = {
  title: 'ExpenseTracker Pro - AI-Powered Expense Management for Businesses',
  description: 'Transform your expense management with AI-powered receipt scanning, intelligent categorization, and real-time insights. Built for modern businesses and professionals.',
  openGraph: {
    title: 'ExpenseTracker Pro - AI-Powered Expense Management',
    description: 'Transform your expense management with AI-powered receipt scanning, intelligent categorization, and real-time insights.',
    images: ['/og-image.png'],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
          <HeroSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <FeaturesSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <PricingSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <TestimonialsSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <CTASection />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
}