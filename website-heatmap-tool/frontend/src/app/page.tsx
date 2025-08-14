import { Metadata } from 'next';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { DemoHeatmap } from '@/components/landing/demo-heatmap';

export const metadata: Metadata = {
  title: 'Heatmap Analytics - See How Users Really Use Your Website',
  description: 'Visualize user behavior with click heatmaps, scroll maps, and session replays. Get actionable insights to optimize your website conversions and improve user experience.',
  openGraph: {
    title: 'Heatmap Analytics - See How Users Really Use Your Website',
    description: 'Visualize user behavior with click heatmaps, scroll maps, and session replays.',
    images: [
      {
        url: '/og-landing.png',
        width: 1200,
        height: 630,
        alt: 'Heatmap Analytics Landing Page',
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <Header />
      
      <main className=\"flex-1\">
        {/* Hero Section with Interactive Demo */}
        <section id=\"hero\" className=\"relative\">
          <Hero />
        </section>

        {/* Interactive Heatmap Demo */}
        <section id=\"demo\" className=\"py-16 sm:py-24\">
          <div className=\"mx-auto max-w-7xl px-6 lg:px-8\">
            <div className=\"mx-auto max-w-2xl text-center mb-16\">
              <h2 className=\"text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white\">
                See Your Website Through Your Users' Eyes
              </h2>
              <p className=\"mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300\">
                Experience how heatmap analytics reveals user behavior patterns that traditional analytics miss.
              </p>
            </div>
            <DemoHeatmap />
          </div>
        </section>

        {/* Features Section */}
        <section id=\"features\" className=\"py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50\">
          <Features />
        </section>

        {/* How It Works */}
        <section id=\"how-it-works\" className=\"py-16 sm:py-24\">
          <HowItWorks />
        </section>

        {/* Pricing */}
        <section id=\"pricing\" className=\"py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50\">
          <Pricing />
        </section>

        {/* Social Proof - Testimonials */}
        <section id=\"testimonials\" className=\"py-16 sm:py-24\">
          <Testimonials />
        </section>

        {/* FAQ */}
        <section id=\"faq\" className=\"py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50\">
          <FAQ />
        </section>

        {/* Final CTA */}
        <section id=\"cta\" className=\"py-16 sm:py-24\">
          <CTA />
        </section>
      </main>

      <Footer />
    </>
  );
}