'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Check, Star } from 'lucide-react';

const benefits = [
  '14-day free trial',
  'No credit card required',
  'Cancel anytime',
  '24/7 support',
];

export function LandingCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm">
              <Star className="h-4 w-4" />
              <span>Join 50,000+ content creators</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Ready to 10x Your
              <br />
              Social Media Reach?
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Stop guessing which hashtags to use. Let AI find the perfect ones 
              for maximum engagement and growth.
            </p>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-300" />
                <span className="text-sm sm:text-base">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="xl"
              className="bg-white text-blue-600 hover:bg-white/90 min-w-[240px] text-lg font-semibold"
            >
              <Link href="/auth/signup">
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 min-w-[240px] text-lg"
            >
              <Link href="#demo">
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/70 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>99.9% Uptime</span>
              </div>
              <div>⭐ 4.9/5 Rating (2,500+ Reviews)</div>
              <div>🔒 Enterprise Security</div>
              <div>🚀 Instant Setup</div>
            </div>
            
            <p className="text-white/60 text-sm">
              No spam, no hidden fees. Start growing your social media presence today.
            </p>
          </div>

          {/* Social Proof */}
          <div className="pt-8">
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
              <div className="text-2xl font-bold">50K+</div>
              <div className="w-px h-8 bg-white/30" />
              <div className="text-2xl font-bold">2.5M+</div>
              <div className="w-px h-8 bg-white/30" />
              <div className="text-2xl font-bold">340%</div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm mt-2">
              <div>Active Users</div>
              <div>Hashtags Analyzed</div>
              <div>Avg. Growth</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}