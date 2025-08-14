'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Clock, CreditCard } from 'lucide-react'

export function CTASection() {
  const benefits = [
    {
      icon: Clock,
      text: 'Setup in under 5 minutes'
    },
    {
      icon: CreditCard,
      text: 'No credit card required'
    },
    {
      icon: CheckCircle,
      text: '14-day free trial'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Main CTA */}
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ready to optimize your
            <span className="block text-yellow-300">customer journeys?</span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of companies using Journey Mapper to increase conversions, 
            reduce churn, and deliver exceptional customer experiences.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <benefit.icon className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 transition-colors">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Schedule Demo
            </Button>
          </div>

          {/* Social proof */}
          <div className="border-t border-white/20 pt-8">
            <p className="text-blue-200 mb-4">
              Join 500+ companies already optimizing their customer journeys
            </p>
            <div className="flex justify-center items-center space-x-8 text-sm text-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>99.9% uptime</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>GDPR compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>SOC 2 certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
    </section>
  )
}