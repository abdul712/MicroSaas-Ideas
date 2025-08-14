import { Suspense } from 'react';
import { Metadata } from 'next';
import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { LandingPricing } from '@/components/landing/pricing';
import { LandingTestimonials } from '@/components/landing/testimonials';
import { LandingCTA } from '@/components/landing/cta';
import { LandingFooter } from '@/components/landing/footer';
import { LandingHeader } from '@/components/landing/header';

export const metadata: Metadata = {
  title: 'HashtagIQ - AI-Powered Social Media Hashtag Research',
  description: 'Discover trending hashtags, analyze competition, and boost your social media reach with our AI-powered hashtag research platform. Get 10x more engagement with data-driven hashtag strategies.',
  openGraph: {
    title: 'HashtagIQ - AI-Powered Social Media Hashtag Research',
    description: 'Discover trending hashtags, analyze competition, and boost your social media reach with our AI-powered hashtag research platform.',
    images: ['/og-image.jpg'],
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <LandingHeader />
      
      <Suspense fallback={<div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" />}>
        <LandingHero />
      </Suspense>
      
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <LandingFeatures />
      </Suspense>
      
      <Suspense fallback={<div className="h-96 bg-gray-50" />}>
        <LandingTestimonials />
      </Suspense>
      
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <LandingPricing />
      </Suspense>
      
      <Suspense fallback={<div className="h-64 bg-gradient-to-r from-blue-600 to-purple-600" />}>
        <LandingCTA />
      </Suspense>
      
      <LandingFooter />
    </div>
  );
}