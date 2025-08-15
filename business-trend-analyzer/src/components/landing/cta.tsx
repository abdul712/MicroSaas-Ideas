import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Ready to transform your business with{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                AI-powered insights?
              </span>
            </h2>
            
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join thousands of businesses already using TrendAnalyzer to make smarter decisions, 
              predict market changes, and stay ahead of the competition.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-blue-100">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">95% Prediction Accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">5-Minute Setup</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="#demo">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-3 border-white/30 text-white hover:bg-white/10"
              >
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Guarantee */}
          <div className="pt-8">
            <p className="text-sm text-blue-100">
              🎯 <strong>Free 14-day trial</strong> • No credit card required • 
              Cancel anytime • <strong>30-day money-back guarantee</strong>
            </p>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">5,000+</div>
            <div className="text-sm text-blue-200">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">$50M+</div>
            <div className="text-sm text-blue-200">Revenue Optimized</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">150+</div>
            <div className="text-sm text-blue-200">Integrations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">99.9%</div>
            <div className="text-sm text-blue-200">Uptime</div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <p className="text-blue-100 text-sm mb-4">Trusted by businesses worldwide</p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            {/* Placeholder for company logos */}
            <div className="w-24 h-8 bg-white/20 rounded"></div>
            <div className="w-24 h-8 bg-white/20 rounded"></div>
            <div className="w-24 h-8 bg-white/20 rounded"></div>
            <div className="w-24 h-8 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    </section>
  )
}